import fs from 'node:fs';
import path from 'node:path';

const dataDir = new URL('../../data/', import.meta.url);

function readJson(file, fallback){
  try{ return JSON.parse(fs.readFileSync(new URL(file, dataDir), 'utf-8')); }
  catch{ return fallback; }
}
function writeJson(file, data){
  fs.writeFileSync(new URL(file, dataDir), JSON.stringify(data,null,2));
}

export const fileStore = {
  getTrends(){ return readJson('trends.json', { lastUpdate:null, trends: [] }); },
  setTrends(payload){ writeJson('trends.json', payload); },

  getReports(){ return readJson('reports.json', { reports: [] }); },
  setReports(payload){ writeJson('reports.json', payload); },

  getAlertRules(){ return readJson('alertRules.json', { rules: [] }); },
  setAlertRules(payload){ writeJson('alertRules.json', payload); },

  getUsers(){ return readJson('users.json', { users: [] }); },
  setUsers(payload){ writeJson('users.json', payload); }
};
