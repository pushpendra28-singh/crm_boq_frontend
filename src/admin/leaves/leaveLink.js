const storageKey = 'crmLeaveReturn';
function clean(search) {
  const query = new URLSearchParams(search);
  if (query.get('module') !== 'leaves') return '';
  const result = new URLSearchParams({ module: 'leaves' });
  if (/^[a-f0-9]{24}$/i.test(query.get('leave') || '')) result.set('leave', query.get('leave'));
  if (/^20\d{2}$/.test(query.get('year') || '')) result.set('year', query.get('year'));
  return result.toString();
}
export function rememberLeaveLink() {
  const query = clean(window.location.search);
  if (query) { try { sessionStorage.setItem(storageKey, query); } catch { /* The original email link remains usable after sign-in. */ } }
}
export function leaveLinkParams() {
  const current = clean(window.location.search);
  let saved = '';
  try { saved = clean(sessionStorage.getItem(storageKey) || ''); } catch { /* Storage can be disabled. */ }
  return new URLSearchParams(current || saved);
}
export function clearLeaveReturn() {
  try { sessionStorage.removeItem(storageKey); } catch { /* No stored return link. */ }
}
