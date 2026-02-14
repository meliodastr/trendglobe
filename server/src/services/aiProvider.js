// Provider wrapper. Implements a simple `complete(prompt)`.

export function makeAIProvider(env){
  const provider = (env.AI_PROVIDER || 'NONE').toUpperCase();
  if (provider === 'NONE') return noneProvider();
  if (provider === 'AZURE') return azureProvider(env);
  return openAIProvider(env);
}

function noneProvider(){
  return { name:'NONE', async complete(_prompt){ return 'AI is not configured.'; } };
}

function openAIProvider(env){
  const key = env.AI_API_KEY;
  const model = env.AI_MODEL_PRIMARY || 'gpt-4.1';
  return {
    name:'OPENAI',
    async complete(prompt, opts={}){
      if(!key) return 'AI key missing.';
      // Note: use official SDK in production. This is minimal fetch.
      const body = {
        model: opts.model || model,
        messages: [
          { role:'system', content: 'You are a cautious assistant. Do not invent facts. Cite sources when provided.' },
          { role:'user', content: prompt }
        ],
        temperature: opts.temperature ?? 0.3
      };
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify(body)
      });
      if(!res.ok) return 'AI request failed.';
      const json = await res.json();
      return json.choices?.[0]?.message?.content || '';
    }
  };
}

function azureProvider(env){
  const key = env.AI_API_KEY;
  const endpoint = env.AI_ENDPOINT;
  const deployment = env.AI_DEPLOYMENT;
  return {
    name:'AZURE',
    async complete(prompt, opts={}){
      if(!key || !endpoint || !deployment) return 'Azure AI config missing.';
      const url = `${endpoint.replace(/\/$/,'')}/openai/deployments/${deployment}/chat/completions?api-version=2024-06-01`;
      const body = {
        messages: [
          { role:'system', content: 'You are a cautious assistant. Do not invent facts. Cite sources when provided.' },
          { role:'user', content: prompt }
        ],
        temperature: opts.temperature ?? 0.3
      };
      const res = await fetch(url, {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'api-key': key },
        body: JSON.stringify(body)
      });
      if(!res.ok) return 'Azure AI request failed.';
      const json = await res.json();
      return json.choices?.[0]?.message?.content || '';
    }
  };
}
