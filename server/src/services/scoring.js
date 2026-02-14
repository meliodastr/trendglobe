// Scoring v1: weight sum + spread bonus.
// Production: store time series and compute deltas.

export function scoreSignals(signals){
  const map = new Map();
  for(const s of signals){
    const key = `${(s.term||'').toLowerCase()}::${s.region||'GLOBAL'}::${s.category||'all'}`;
    const cur = map.get(key) || { term: s.term, region: s.region||'GLOBAL', category: s.category||'all', sources: new Set(), score: 0, sample: [] };
    cur.score += (s.weight || 0.3);
    cur.sources.add(s.source);
    cur.sample.push({ source: s.source, title: s.title, url: s.url });
    map.set(key, cur);
  }

  const items = [...map.values()].map(t=>{
    const spread = t.sources.size;
    const momentum = Math.min(100, Math.round(t.score*28 + spread*8));
    const velocity = `+${Math.min(500, Math.round(t.score*70))}%`;
    return {
      id: slug(`${t.term}-${t.region}-${t.category}`),
      term: t.term,
      region: t.region,
      category: t.category,
      momentum,
      velocity,
      sources: [...t.sources],
      signals: t.sample.slice(0, 15)
    };
  });

  items.sort((a,b)=>b.momentum-a.momentum);
  return items;
}

function slug(s){
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,80);
}
