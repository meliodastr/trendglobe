import fs from 'node:fs';

export function loadHelpDocs(){
  const dir = new URL('../../docs/', import.meta.url);
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.md'));
  const docs = files.map(f=>({
    id: f,
    text: fs.readFileSync(new URL(f, dir),'utf-8')
  }));
  return docs;
}

export function retrieveDocs(docs, query){
  const q = query.toLowerCase();
  const scored = docs.map(d=>({
    id: d.id,
    text: d.text,
    score: score(d.text.toLowerCase(), q)
  })).sort((a,b)=>b.score-a.score);
  return scored.filter(x=>x.score>0).slice(0,3);
}

function score(text, q){
  const terms = q.split(/\W+/).filter(Boolean);
  let s=0;
  for(const t of terms){
    const m = text.split(t).length-1;
    s += m;
  }
  return s;
}
