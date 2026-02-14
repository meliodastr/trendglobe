export async function fetchWikiSignals(){
  // Wikipedia trending is not a simple official endpoint; as a safe placeholder, use Wikimedia featured feed.
  const url = 'https://en.wikipedia.org/wiki/Special:NewPages?feed=rss';
  const items = await fetchRSS(url);
  return items.slice(0,40).map(x => ({ source:'wiki', term: guessTerm(x.title), title: x.title, url: x.link, weight: 0.3, region:'GLOBAL', category:'culture' }));
}

function guessTerm(title){ return title.split(/\s+/).slice(0,4).join(' ');} 

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
