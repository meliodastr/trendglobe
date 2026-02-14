export async function fetchNewsSignals(){
  // Google News RSS broad
  const url = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
  const items = await fetchRSS(url);
  return items.map(x => ({ source:'news', term: guessTerm(x.title), title: x.title, url: x.link, weight: 0.6, region:'US', category:'culture' }));
}

function guessTerm(title){
  return title.split(/\s+/).slice(0,4).join(' ');
}

async function fetchRSS(url){
  try{ const res=await fetch(url); const xml=await res.text(); return parseRSS(xml);}catch{return[]}
}

function parseRSS(xml){
  const items=[];
  const parts=xml.split('<item>').slice(1);
  for(const p of parts){
    const title=extract(p,'<title>','</title>');
    const link=extract(p,'<link>','</link>');
    if(title && link) items.push({ title: decode(title), link: link.trim() });
  }
  return items;
}

function extract(s,a,b){const i=s.indexOf(a); if(i<0) return ''; const j=s.indexOf(b,i+a.length); if(j<0) return ''; return s.slice(i+a.length,j);} 
function decode(s){return s.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
