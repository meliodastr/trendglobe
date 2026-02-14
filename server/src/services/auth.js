import { jwtVerify } from 'jose';

export function authMiddleware({ mode='DEV', secret='', issuer='', audience='' }){
  return async function(req, _res, next){
    req.user = { id: 'dev-user', plan: 'free', email: 'dev@local' };
    if (mode === 'DEV') return next();

    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
    if (!token) return next();

    try{
      const key = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(token, key, { issuer, audience });
      req.user = {
        id: payload.sub || payload.user_id || 'user',
        email: payload.email,
        plan: payload.plan || 'free'
      };
    }catch{
      // ignore invalid token; treat as guest
    }
    next();
  };
}

export function requirePro(req, res, next){
  if ((req.user?.plan || 'free') !== 'pro') {
    return res.status(402).json({ error: 'Pro required' });
  }
  next();
}
