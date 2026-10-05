import API_BASE_URL from '../../config/api';
// This file sits in src/admin/leaves: config is two folders above.
export async function leaveApi(path, { method = 'GET', body, signal } = {}) {
  const token = localStorage.getItem('adminToken');
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  const controller = new AbortController();
  let timeout = false;
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(() => { timeout = true; controller.abort(); }, 25000);
  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/leaves${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: controller.signal, cache: 'no-store',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) throw new Error(data?.message || 'Unable to complete the request. Refresh to check the latest state.');
    return data;
  } catch (error) {
    if (timeout) throw new Error('Request timed out. Refresh to check whether your change was saved before retrying.');
    if (error instanceof TypeError) throw new Error('Connection failed. Refresh to check whether your change was saved before retrying.');
    throw error;
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
}
