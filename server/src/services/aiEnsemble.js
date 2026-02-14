import { makeAIProvider } from './aiProvider.js';

// Multi-model ensemble: summarizer + checker + translator + classifier.
// Uses the same provider but different model settings; you can mix providers by extending makeAIProvider.

export function makeEnsemble(env){
  const ai = makeAIProvider(env);
  const models = {
    primary: env.AI_MODEL_PRIMARY,
    checker: env.AI_MODEL_CHECKER,
    translator: env.AI_MODEL_TRANSLATOR,
    classifier: env.AI_MODEL_CLASSIFIER
  };

  async function summarizeTrend({ term, signals, lang='en' }){
    const sources = (signals||[]).map(s => `- ${s.source}: ${s.title || s.term || ''}`).slice(0, 30).join('
');
    const prompt = `Summarize why "${term}" is trending. Use ONLY the provided sources.

Sources:
${sources}

Output JSON with keys: why, ideas (3 bullets), riskNote.`;
    const raw = await ai.complete(prompt, { model: models.primary, temperature: 0.2 });

    const checked = await factCheck({ raw, sources, models, ai });
    const localized = lang !== 'en' ? await translateIfNeeded({ text: checked.why, lang, models, ai }) : checked.why;

    return {
      why: localized,
      ideas: checked.ideas,
      riskNote: checked.riskNote,
      provider: ai.name
    };
  }

  return { summarizeTrend };
}

async function factCheck({ raw, sources, models, ai }){
  const prompt = `You are a verifier. If the summary contains claims not supported by sources, remove them.
Return STRICT JSON: {"why":"...","ideas":["..."],"riskNote":"..."}.
Sources:
${sources}

Draft:
${raw}`;
  const out = await ai.complete(prompt, { model: models.checker, temperature: 0 });
  try{ return JSON.parse(extractJson(out)); }catch{ return { why: String(raw).slice(0,400), ideas: [], riskNote:'Verify with sources.' }; }
}

async function translateIfNeeded({ text, lang, models, ai }){
  const prompt = `Translate to ${lang}. Keep meaning. Text:
${text}`;
  const out = await ai.complete(prompt, { model: models.translator, temperature: 0.2 });
  return out;
}

function extractJson(s){
  const m = String(s).match(/\{[\s\S]*\}/);
  return m ? m[0] : '{}';
}
