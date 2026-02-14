export async function fetchRedditSignals(){
  // Use RSS for broad compatibility (per-subreddit RSS). Add more subreddits as you like.
  const subs = ['technology','worldnews','Futurology','sports','finance','CryptoCurrency'];
  const out = [];
  for(const s of subs){
    const url = `https://www.reddit.com/r/${s}/.rss`;
    const items = await fetchRSS(url);
    for(const it of items.slice(0,25)){
      out.push({ source:'reddit', term: guessTerm(it.title), title: it.title, url: it.link, weight: 0.6, region:'GLOBAL', category: mapCat(s) });
    }
  }
  return out;
}

function mapCat(sub){
  const t = sub.toLowerCase();
  if(['sports'].includes(t)) return 'sports';
  if(['finance','cryptocurrency'].includes(t)) return 'finance';
  return 'tech';
}

function guessTerm(title){
  return title.split(/\s+/).slice(0,4).join(' ');
}

async function fetchRSS(url){
  try{
    const res = await fetch(url, { headers: { 'User-Agent':'TrendGlobeBot/1.0 (respect robots, no scraping)' } });
    const xml = await res.text();
    return parseRSS(xml);
  }catch{ return []; }
}

function parseRSS(xml){
  const items = [];
  const parts = xml.split('<entry>').slice(1);
  for(const p of parts){
    const title = extract(p,'<title','</title>');
    const link = extractLink(p);
    const cleanTitle = stripTags(title);
    if(cleanTitle && link) items.push({ title: cleanTitle, link });
  }
  return items;
}

function extract(s,a,b){
  const i=s.indexOf(a); if(i<0) return '';
  const j=s.indexOf(b,i); if(j<0) return '';
  return s.slice(i, j);
}

function extractLink(s){
  const m = s.match(/<link[^>]*href="([^"]+)"/);
  return m ? m[1] : '';
}

function stripTags(s){
  return String(s).replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').trim();
}
