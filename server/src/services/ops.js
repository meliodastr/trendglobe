export function captureError(_env, err){
  // Plug in Sentry if DSN set.
  console.error('[error]', err);
}
