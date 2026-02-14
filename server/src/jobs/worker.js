import 'dotenv/config';
import { getStore } from '../storage/index.js';
import { scoreSignals } from '../services/scoring.js';
import { makeEnsemble } from '../services/aiEnsemble.js';
import { buildReportFromTrends } from '../services/reports.js';
import { fetchHNSignals } from '../connectors/hn.js';
import { fetchRedditSignals } from '../connectors/reddit.js';
import { fetchYouTubeSignals } from '../connectors/youtube.js';
import { fetchNewsSignals } from '../connectors/news.js';
import { fetchWikiSignals } from '../connectors/wiki.js';
import { fetchGitHubSignals } from '../connectors/github.js';

const env = process.env;
const store = getStore();
const ensemble = makeEnsemble(env);

async function collectOnce(){
  const signals = [
    ...(await fetchHNSignals()),
    ...(await fetchRedditSignals()),
    ...(await fetchYouTubeSignals()),
    ...(await fetchNewsSignals()),
    ...(await fetchWikiSignals()),
    ...(await fetchGitHubSignals())
  ];

  const ranked = scoreSignals(signals).slice(0, 30);

  // Enrich top trends with AI explanations
  const enriched = [];
  for(const t of ranked){
    const ai = await ensemble.summarizeTrend({ term: t.term, signals: t.signals, lang: 'en' });
    enriched.push({ ...t, summary: ai.why, ai, locked: t.momentum >= 80 });
  }

  const payload = { lastUpdate: new Date().toISOString(), trends: enriched };
  store.setTrends(payload);

  // SEO report generation (EN/TR/ES)
  const reportsStore = store.getReports();
  const reports = reportsStore.reports || [];
  for(const lang of ['en','tr','es']){
    const rep = buildReportFromTrends({ trends: enriched, lang });
    // keep last 90
    const idx = reports.findIndex(r => r.slug === rep.slug);
    const url = `/reports/${rep.slug}`;
    const item = { slug: rep.slug, title: rep.title, url, publishedAt: rep.publishedAt };
    if(idx>=0) reports[idx] = item; else reports.unshift(item);
    store.setReports({ reports: reports.slice(0,90) });
    // Store HTML to file
    const fs = await import('node:fs');
    const dir = new URL('../../content/reports/', import.meta.url);
    fs.writeFileSync(new URL(`${rep.slug}.html`, dir), rep.html);
  }

  console.log(`[worker] updated ${enriched.length} trends at ${payload.lastUpdate}`);
}

await collectOnce();
setInterval(collectOnce, 15*60*1000);
