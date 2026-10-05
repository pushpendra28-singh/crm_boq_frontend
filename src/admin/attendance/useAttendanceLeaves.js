import { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../../config/api';

export default function useAttendanceLeaves(employeeId, month, refreshKey) {
  const [state, setState] = useState({ key: '', days: [], loading: false, error: '' });
  const key = `${employeeId}:${month}`;
  useEffect(() => {
    let active = true, running = false, controller;
    if (!employeeId) {
      setState({ key, days: [], loading: false, error: '' });
      return;
    }
    setState({ key, days: [], loading: true, error: '' });
    async function load() {
      if (running || !active) return;
      running = true;
      controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 20000);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('Your session has expired. Please sign in again.');
        const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/attendance/leave-days?${new URLSearchParams({ employeeId, month })}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: 'no-store',
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) throw new Error(data?.message || 'Unable to load approved leaves.');
        const seen = new Set();
        if (data.employeeId !== employeeId || data.month !== month || !Array.isArray(data.days) || data.days.some(day => {
          if (!day || typeof day.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
              day.date.slice(0, 7) !== month || !Number.isFinite(Date.parse(`${day.date}T00:00:00Z`)) ||
              new Date(`${day.date}T00:00:00Z`).toISOString().slice(0, 10) !== day.date || seen.has(day.date) ||
              !Array.isArray(day.leaves) || !day.leaves.length || typeof day.conflict !== 'boolean' ||
              typeof day.units !== 'number' || !Number.isFinite(day.units) || day.units <= 0 ||
              day.leaves.some(leave => !leave || typeof leave.requestId !== 'string' || typeof leave.typeName !== 'string' ||
                typeof leave.paid !== 'boolean' || typeof leave.cancellationPending !== 'boolean' ||
                !['full', 'first_half', 'second_half'].includes(leave.portion) || ![0.5, 1].includes(leave.units))) return true;
          seen.add(day.date); return false;
        })) throw new Error('Invalid approved-leave response. Please refresh.');
        if (active) setState({ key, days: data.days, loading: false, error: '' });
      } catch (error) {
        if (active) setState({ key, days: [], loading: false, error: timedOut ? 'Approved-leave request timed out. Please refresh.' : error instanceof TypeError ? 'Unable to connect to load approved leaves.' : error.message });
      } finally { clearTimeout(timer); running = false; }
    }
    void load();
    const refreshVisible = () => { if (document.visibilityState === 'visible') void load(); };
    const timer = setInterval(refreshVisible, 30000);
    window.addEventListener('focus', refreshVisible);
    document.addEventListener('visibilitychange', refreshVisible);
    return () => {
      active = false;
      clearInterval(timer);
      controller?.abort();
      window.removeEventListener('focus', refreshVisible);
      document.removeEventListener('visibilitychange', refreshVisible);
    };
  }, [employeeId, month, refreshKey, key]);
  const days = state.key === key ? state.days : [];
  const byDate = useMemo(() => new Map(days.map(day => [day.date, day])), [days]);
  return { byDate, loading: Boolean(employeeId) && (state.key !== key || state.loading), error: state.key === key ? state.error : '' };
}
