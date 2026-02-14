import 'dotenv/config';
import { getStore } from '../storage/index.js';
import fs from 'node:fs';

const base = (process.env.BASE_URL || 'https://yourdomain.com').replace(/\/$/,'');
const store = getStore();

const { reports=[] } = store.getReports();
const urls = [
  `${base}/`,
  `${base}/reports`
].concat(reports.map(r => `${base}${r.url}`));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u=>`  <url><loc>${u}</loc></url>`).join('
')}
</urlset>`;

fs.writeFileSync(new URL('../../content/sitemap.xml', import.meta.url), xml);
console.log('[sitemap] written content/sitemap.xml');
