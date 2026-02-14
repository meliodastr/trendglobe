import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';

import { getStore } from './storage/index.js';
import { authMiddleware, requirePro } from './services/auth.js';
import { loadHelpDocs, retrieveDocs } from './services/helpRag.js';
import { makeEnsemble } from './services/aiEnsemble.js';
import { captureError } from './services/ops.js';

const env = process.env;
const app = express();
const store = getStore();
const ensemble = makeEnsemble(env);
const helpDocs = loadHelpDocs();

app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: env.CORS_ORIGIN || '*' }));
app.use(authMiddleware({
  mode: env.AUTH_MODE || 'DEV',
  secret: env.JWT_SECRET || '',
  issuer: env.JWT_ISSUER || '',
  audience: env.JWT_AUDIENCE || ''
}));

app.get('/health', (_req, res) => {
  const trends = store.getTrends();
  res.json({ ok:true, now: new Date().toISOString(), lastUpdate: trends.lastUpdate });
});

// Trends list
app.get('/api/trends', (req, res) => {
  const { region='GLOBAL', category='all', source='all', limit='12' } = req.query;
  const lim = Math.max(1, Math.min(50, parseInt(limit,10) || 12));

  const payload = store.getTrends();
  let trends = payload.trends || [];

  if(region !== 'GLOBAL') trends = trends.filter(t => t.region === region);
  if(category !== 'all') trends = trends.filter(t => t.category === category);
  if(source !== 'all') trends = trends.filter(t => (t.sources||[]).includes(source));

  // Free plan gating: hide locked summary details? (server-side)
  if ((req.user?.plan || 'free') !== 'pro') {
    trends = trends.map(t => ({ ...t, ai: undefined, signals: undefined }));
  }

  res.json({ lastUpdate: payload.lastUpdate, trends: trends.slice(0, lim) });
});

// Trend detail (Pro required when locked)
app.get('/api/trends/:id', (req, res) => {
  const payload = store.getTrends();
  const t = (payload.trends||[]).find(x => x.id === req.params.id);
  if(!t) return res.status(404).json({ error:'Not found' });

  if (t.locked && (req.user?.plan || 'free') !== 'pro') {
    return res.status(402).json({ error:'Pro required' });
  }

  res.json(t);
});

// Help center ask (RAG + AI). Always cites docs.
app.post('/api/help/ask', async (req, res) => {
  try{
    const q = String(req.body?.q || '').slice(0, 600);
    if(!q) return res.status(400).json({ error:'q required' });

    const top = retrieveDocs(helpDocs, q);
    const context = top.map(d => `# ${d.id}
${d.text}`).join('

');
    const prompt = `Answer the question using ONLY the context. If missing, say you don't know.

Question: ${q}

Context:
${context}

Return HTML (short).`;
    const answer = await ensemble.summarizeTrend({ term: 'HelpAnswer', signals: [{ source:'help', title: prompt }], lang: (req.headers['x-lang'] || 'en') });

    // We use summarizeTrend as a safe wrapper; for production, add a dedicated helpAnswer method.
    res.json({ answer: answer.why, citations: top.map(d=>d.id) });
  } catch(err){
    captureError(env, err);
    res.status(500).json({ error:'help_failed' });
  }
});

// Reports list
app.get('/api/reports', (req, res) => {
  const { limit='30' } = req.query;
  const lim = Math.max(1, Math.min(100, parseInt(limit,10) || 30));
  const payload = store.getReports();
  res.json({ reports: (payload.reports||[]).slice(0, lim) });
});

// Serve generated report HTML (SEO)
app.get('/reports/:slug', (req, res) => {
  const slug = req.params.slug;
  const file = new URL(`../content/reports/${slug}.html`, import.meta.url);
  if(!fs.existsSync(file)) return res.status(404).send('Not found');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(fs.readFileSync(file,'utf-8'));
});

// Serve sitemap (generated)
app.get('/sitemap.xml', (req, res) => {
  const file = new URL('../content/sitemap.xml', import.meta.url);
  if(!fs.existsSync(file)) return res.status(404).send('Not found');
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(fs.readFileSync(file,'utf-8'));
});

// Basic 404
app.use((_req,res)=>res.status(404).json({ error:'not_found' }));

const port = parseInt(env.PORT || '8787', 10);
app.listen(port, () => console.log(`[server] http://localhost:${port}`));
