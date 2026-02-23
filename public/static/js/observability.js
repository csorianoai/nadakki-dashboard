/**
 * NADAKKI Agent Observability - Static Dashboard
 * - Multi-tenant via X-Tenant-ID
 * - SSE: Preferencia A (stream_url) o B (fetch+ReadableStream)
 * - Reconnect backoff 1s/2s/4s + lastEventId
 */

(function () {
  'use strict';

  const DEFAULT_API = 'https://nadakki-ai-suite.onrender.com';
  const POLL_MS = (typeof window !== 'undefined' && window.NADAKKI_OBSERVE_CONFIG?.pollIntervalMs) || 10000;
  const RECONNECT_BACKOFFS = [1000, 2000, 4000];

  let apiBase = null;
  let isDemo = false;
  let selectedRunId = null;
  let currentStreamAbort = null;
  let reconnectAttempt = 0;

  function getTenant() {
    const sel = document.getElementById('tenant-select');
    return (sel && sel.value) || localStorage.getItem('lastInstitution') || 'demo';
  }

  function setTenant(val) {
    try { localStorage.setItem('lastInstitution', val); } catch (_) {}
    const sel = document.getElementById('tenant-select');
    if (sel) sel.value = val;
  }

  async function detectApiBase() {
    if (typeof window !== 'undefined' && window.NADAKKI_API_BASE) {
      return window.NADAKKI_API_BASE;
    }
    const origins = [window.location.origin, DEFAULT_API];
    for (const base of origins) {
      for (const path of ['/api/v1/health', '/api/health', '/health']) {
        try {
          const url = base + path;
          const r = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(3000) });
          if (r.ok) return base.replace(/\/$/, '');
        } catch (_) {}
      }
    }
    return DEFAULT_API;
  }

  function ensureApiBase() {
    if (apiBase) return apiBase;
    apiBase = DEFAULT_API;
    return apiBase;
  }

  async function initApiBase() {
    apiBase = await detectApiBase();
    return apiBase;
  }

  function showBadge(mode) {
    const live = document.getElementById('badge-mode');
    const demo = document.getElementById('badge-demo');
    if (!live || !demo) return;
    live.style.display = mode === 'live' ? 'inline' : 'none';
    demo.style.display = mode === 'demo' ? 'inline' : 'none';
  }

  function fetchApi(path, opts = {}) {
    const base = ensureApiBase();
    const url = base.startsWith('http') ? base + path : (window.location.origin + path);
    const tenant = getTenant();
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Tenant-ID': tenant,
      ...(opts.headers || {}),
    };
    return fetch(url, {
      ...opts,
      headers: { ...headers, ...(opts.headers || {}) },
    });
  }

  async function loadRuns() {
    const tbody = document.getElementById('runs-tbody');
    if (!tbody) return;

    try {
      const base = ensureApiBase();
      const tenant = getTenant();
      const res = await fetch(base + '/api/v1/runs?tenant_id=' + encodeURIComponent(tenant) + '&limit=20', {
        headers: { 'X-Tenant-ID': tenant },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(res.status + '');
      const data = await res.json();
      const runs = data.runs || data.data || data || [];
      renderRuns(Array.isArray(runs) ? runs : []);
      showBadge('live');
    } catch (err) {
      renderRuns(getDemoRuns());
      showBadge('demo');
    }
  }

  function getDemoRuns() {
    return [
      { run_id: 'demo-run-1', status: 'running', created_at: new Date().toISOString() },
      { run_id: 'demo-run-2', status: 'done', created_at: new Date(Date.now() - 60000).toISOString() },
    ];
  }

  function renderRuns(runs) {
    const tbody = document.getElementById('runs-tbody');
    if (!tbody) return;
    if (!runs.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="console-empty">No hay runs</td></tr>';
      return;
    }
    tbody.innerHTML = runs.map(function (r) {
      const id = r.run_id || r.id || r.runId || '-';
      const status = (r.status || 'unknown').toLowerCase();
      const created = r.created_at || r.createdAt || '-';
      const short = id.length > 20 ? id.slice(0, 16) + '…' : id;
      const cls = selectedRunId === id ? 'cursor' : '';
      return (
        '<tr class="' + cls + '" data-run-id="' + id + '">' +
        '<td title="' + id + '">' + short + '</td>' +
        '<td><span class="status status-' + status + '">' + status + '</span></td>' +
        '<td>' + new Date(created).toLocaleTimeString() + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function appendLog(text, kind) {
    const logs = document.getElementById('console-logs');
    const output = document.getElementById('console-output');
    if (!logs) return;
    const target = kind === 'output' ? output : logs;
    if (!target) return;
    const line = document.createElement('div');
    line.className = 'console-line';
    const time = new Date().toLocaleTimeString();
    line.innerHTML = '<span class="console-time">[' + time + ']</span>' + escapeHtml(String(text));
    target.appendChild(line);
    target.classList.remove('console-empty');
    target.scrollTop = target.scrollHeight;
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function clearConsole() {
    ['console-logs', 'console-output'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = '';
        el.classList.add('console-empty');
      }
    });
  }

  function connectSSE(streamUrl, runId) {
    if (currentStreamAbort) {
      currentStreamAbort.abort();
      currentStreamAbort = null;
    }
    selectedRunId = runId;
    highlightRun(runId);
    updateCancelButton(true);

    if (streamUrl && (streamUrl.startsWith('http') || streamUrl.startsWith('//'))) {
      connectSSE_OptionA(streamUrl, runId);
    } else {
      connectSSE_OptionB(runId);
    }
  }

  function connectSSE_OptionA(streamUrl, runId) {
    let lastEventId = '';
    let es = null;

    function doConnect() {
      try {
        const url = lastEventId ? streamUrl + (streamUrl.includes('?') ? '&' : '?') + 'lastEventId=' + encodeURIComponent(lastEventId) : streamUrl;
        es = new EventSource(url);
        es.onmessage = function (e) {
          lastEventId = e.lastEventId || lastEventId;
          appendLog(e.data || '', 'logs');
        };
        es.onerror = function () {
          if (es) es.close();
          const delay = RECONNECT_BACKOFFS[Math.min(reconnectAttempt, RECONNECT_BACKOFFS.length - 1)];
          reconnectAttempt++;
          setTimeout(function () {
            doConnect();
          }, delay);
        };
      } catch (err) {
        appendLog('SSE error: ' + err.message, 'logs');
      }
    }
    doConnect();
    currentStreamAbort = { abort: function () { if (es) es.close(); es = null; } };
  }

  function connectSSE_OptionB(runId) {
    const tenant = getTenant();
    const base = ensureApiBase();
    const url = base + '/api/v1/runs/' + encodeURIComponent(runId) + '/stream';
    let lastEventId = '';

    function doConnect() {
      const headers = { 'Accept': 'text/event-stream', 'X-Tenant-ID': tenant };
      if (lastEventId) headers['Last-Event-ID'] = lastEventId;
      const ctrl = new AbortController();
      currentStreamAbort = ctrl;

      fetch(url, { headers, signal: ctrl.signal })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status + '');
          if (!res.body) throw new Error('No body');
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = '';
          function pump() {
            return reader.read().then(function (r) {
              if (r.done) return;
              buf += dec.decode(r.value, { stream: true });
              const lines = buf.split(/\r?\n/);
              buf = lines.pop() || '';
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith('id:')) lastEventId = line.slice(3).trim();
                if (line.startsWith('data:')) appendLog(line.slice(5).trim(), 'logs');
              }
              return pump();
            });
          }
          return pump();
        })
        .catch(function (err) {
          if (err.name === 'AbortError') return;
          appendLog('SSE error: ' + err.message, 'logs');
          const delay = RECONNECT_BACKOFFS[Math.min(reconnectAttempt, RECONNECT_BACKOFFS.length - 1)];
          reconnectAttempt++;
          setTimeout(doConnect, delay);
        });
    }
    doConnect();
  }

  function highlightRun(runId) {
    document.querySelectorAll('#runs-tbody tr').forEach(function (tr) {
      tr.classList.toggle('cursor', tr.dataset.runId === runId);
    });
  }

  function updateCancelButton(enabled) {
    const btn = document.getElementById('btn-cancel');
    if (btn) btn.disabled = !enabled;
  }

  async function executeDryRun() {
    const agentInput = document.getElementById('agent-id');
    const agentId = (agentInput && agentInput.value.trim()) || 'test-agent';
    const tenant = getTenant();

    const btn = document.getElementById('btn-run');
    if (btn) btn.disabled = true;

    try {
      const base = ensureApiBase();
      const url = base + '/api/v1/agents/' + encodeURIComponent(agentId) + '/execute';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenant,
        },
        body: JSON.stringify({
          payload: { test: true, tenant_id: tenant },
          dry_run: true,
          live: false,
          auto_publish: false,
          auto_email: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(function () { return {}; });
        throw new Error(err.detail || err.message || 'HTTP ' + res.status);
      }

      const data = await res.json();
      const runId = data.run_id || data.runId;
      const streamUrl = data.stream_url || data.streamUrl;

      if (runId) {
        clearConsole();
        appendLog('Run started: ' + runId, 'logs');
        loadRuns();
        connectSSE(streamUrl || null, runId);
      } else {
        appendLog(JSON.stringify(data, null, 2), 'output');
      }
      showBadge('live');
    } catch (err) {
      appendLog('Execute error: ' + err.message, 'logs');
      isDemo = true;
      showBadge('demo');
      runDemoSimulation();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function runDemoSimulation() {
    const runId = 'demo-' + Date.now();
    selectedRunId = runId;
    clearConsole();
    appendLog('DEMO: simulado run ' + runId, 'logs');
    loadRuns();
    setTimeout(function () {
      appendLog('DEMO: evento 1', 'logs');
    }, 500);
    setTimeout(function () {
      appendLog('DEMO: evento 2', 'logs');
    }, 1500);
    setTimeout(function () {
      appendLog('DEMO: done', 'logs');
      updateCancelButton(false);
    }, 3000);
  }

  async function cancelRun() {
    if (!selectedRunId) return;
    try {
      const res = await fetchApi('/api/v1/runs/' + encodeURIComponent(selectedRunId) + '/cancel', {
        method: 'POST',
      });
      if (res.ok) {
        appendLog('Cancel request sent', 'logs');
        if (currentStreamAbort) currentStreamAbort.abort();
        updateCancelButton(false);
      } else {
        appendLog('Cancel failed: ' + res.status, 'logs');
      }
    } catch (err) {
      appendLog('Cancel error: ' + err.message, 'logs');
    }
  }

  function onRunClick(e) {
    const tr = e.target.closest('tr[data-run-id]');
    if (!tr) return;
    const runId = tr.dataset.runId;
    if (!runId) return;
    clearConsole();
    appendLog('Conectando a run: ' + runId, 'logs');
    connectSSE(null, runId);
  }

  function initTabs() {
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        const key = tab.dataset.tab;
        document.getElementById('console-logs').style.display = key === 'logs' ? 'block' : 'none';
        document.getElementById('console-output').style.display = key === 'output' ? 'block' : 'none';
      });
    });
  }

  function init() {
    const tenantSel = document.getElementById('tenant-select');
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('lastInstitution')) || 'demo';
    if (tenantSel) {
      if (!Array.from(tenantSel.options).some(function (o) { return o.value === saved; })) {
        const opt = document.createElement('option');
        opt.value = saved;
        opt.textContent = saved;
        tenantSel.appendChild(opt);
      }
      tenantSel.value = saved;
      tenantSel.addEventListener('change', function () {
        setTenant(tenantSel.value);
        loadRuns();
      });
    }

    document.getElementById('btn-run')?.addEventListener('click', executeDryRun);
    document.getElementById('btn-cancel')?.addEventListener('click', cancelRun);
    document.getElementById('runs-tbody')?.addEventListener('click', onRunClick);
    initTabs();

    initApiBase().then(function () {
      loadRuns();
      setInterval(loadRuns, POLL_MS);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
