// UptimeRobot v2 — form-encoded POST, not JSON, and failure is signaled by
// stat: 'fail' inside a 200 response rather than a non-2xx status, so this
// can't reuse the vercelRequest/googleApiRequest error-check pattern as-is.
const fetch = require('node-fetch');

const API = 'https://api.uptimerobot.com/v2';
const STATUS_MAP = { 0: 'PAUSED', 1: 'PENDING', 2: 'UP', 8: 'SEEMS_DOWN', 9: 'DOWN' };

async function uptimeRequest(endpoint, params = {}) {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  if (!apiKey) throw new Error('UPTIMEROBOT_API_KEY is not configured');

  const body = new URLSearchParams({ api_key: apiKey, format: 'json', ...params });
  const res = await fetch(`${API}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.stat === 'fail') {
    throw new Error(`UptimeRobot ${endpoint} failed: ${JSON.stringify(data.error || data).slice(0, 500)}`);
  }
  return data;
}

// type: '1' = HTTP(s) monitor, the only kind a generated site needs.
async function createMonitor(friendlyName, url) {
  const data = await uptimeRequest('newMonitor', { friendly_name: friendlyName, url, type: '1', interval: '300' });
  return { monitorId: String(data.monitor.id), status: STATUS_MAP[data.monitor.status] || 'PENDING' };
}

async function getMonitorStatus(monitorId) {
  const data = await uptimeRequest('getMonitors', { monitors: String(monitorId), custom_uptime_ratios: '30' });
  const monitor = data.monitors && data.monitors[0];
  if (!monitor) throw new Error(`Monitor ${monitorId} not found`);
  return {
    status: STATUS_MAP[monitor.status] || 'UNKNOWN',
    uptimeRatio30d: monitor.custom_uptime_ratio ? Number(monitor.custom_uptime_ratio) : null,
    checkedAt: new Date().toISOString(),
  };
}

async function deleteMonitor(monitorId) {
  return uptimeRequest('deleteMonitor', { id: String(monitorId) });
}

module.exports = { createMonitor, getMonitorStatus, deleteMonitor };
