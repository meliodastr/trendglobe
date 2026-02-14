// GitHub Actions: ping health endpoint and notify Telegram on failure.

const url = process.env.HEALTH_URL;
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if(!url){
  console.error('Missing HEALTH_URL secret');
  process.exit(1);
}

async function notify(msg){
  if(!token || !chatId){
    console.error('Telegram not configured; message:', msg);
    return;
  }
  const api = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(api, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ chat_id: chatId, text: msg })});
}

(async ()=>{
  try{
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error('bad status ' + res.status);
    const j = await res.json();
    if(!j.ok) throw new Error('not ok');
    console.log('OK', j);
  }catch(e){
    console.error('DOWN', e);
    await notify(`🚨 TrendGlobe DOWN
${url}
${String(e)}`);
    process.exit(2);
  }
})();
