(() => {
  'use strict';

  const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dateTime = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const value = (input) => Number(input || 0);
  const displayDate = (input) => input ? date.format(new Date(`${String(input).slice(0, 10)}T12:00:00`)) : '—';
  const displayDateTime = (input) => input ? dateTime.format(new Date(input)) : '—';
  const compactMoney = (input) => {
    const amount = value(input);
    if (Math.abs(amount) >= 1_000_000) return `S/ ${(amount / 1_000_000).toLocaleString('es-PE', { maximumFractionDigits: 2 })} mill.`;
    if (Math.abs(amount) >= 1_000) return `S/ ${(amount / 1_000).toLocaleString('es-PE', { maximumFractionDigits: 1 })} mil`;
    return money.format(amount);
  };

  function setText(id, content) { document.getElementById(id).textContent = content; }

  function renderBars(id, rows, labelKey, valueKey, formatter, activeLabel = '') {
    const container = document.getElementById(id);
    const maximum = Math.max(...rows.map(row => value(row[valueKey])), 1);
    container.innerHTML = rows.map(row => {
      const label = row[labelKey];
      const selected = activeLabel && label === activeLabel ? ' highlight' : '';
      const width = Math.max(1, (value(row[valueKey]) / maximum) * 100);
      return `<div class="bar-item${selected}"><span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${width.toFixed(2)}%"></div></div><span class="bar-value">${formatter(row[valueKey])}</span></div>`;
    }).join('') || '<p class="muted">Sin datos disponibles.</p>';
  }

  function renderDistricts(rows, province = '') {
    const data = province ? rows.filter(row => row.provincia === province) : rows;
    const body = document.getElementById('district-table');
    body.innerHTML = data.map(row => `<tr><td>${escapeHtml(row.provincia)}</td><td>${escapeHtml(row.distrito)}</td><td class="number">${number.format(value(row.suministros))}</td><td class="number">${compactMoney(row.deuda_total)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">No hay distritos para la provincia seleccionada.</td></tr>';
  }

  function renderTrend(rows) {
    const host = document.getElementById('trend-chart');
    if (!rows.length) { host.innerHTML = '<p class="muted">No hay histórico disponible.</p>'; return; }
    const width = 860, height = 255, margin = { top: 22, right: 22, bottom: 40, left: 65 };
    const chartWidth = width - margin.left - margin.right, chartHeight = height - margin.top - margin.bottom;
    const points = rows.map((row, index) => ({ ...row, x: margin.left + ((rows.length === 1 ? .5 : index / (rows.length - 1)) * chartWidth) }));
    const max = Math.max(...rows.flatMap(row => [value(row.deuda_total), value(row.saldo_total)]), 1) * 1.08;
    const y = amount => margin.top + chartHeight - ((amount / max) * chartHeight);
    const line = field => points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)},${y(value(point[field])).toFixed(2)}`).join(' ');
    const ticks = 4;
    let grid = '';
    for (let index = 0; index <= ticks; index += 1) {
      const amount = (max / ticks) * index;
      const yPosition = y(amount);
      grid += `<line class="grid" x1="${margin.left}" x2="${width - margin.right}" y1="${yPosition}" y2="${yPosition}"></line><text class="axis-label" x="${margin.left - 8}" y="${yPosition + 4}" text-anchor="end">${escapeHtml(compactMoney(amount))}</text>`;
    }
    const labels = [];
    const interval = Math.max(1, Math.ceil(rows.length / 6));
    points.forEach((point, index) => { if (index % interval === 0 || index === points.length - 1) labels.push(`<text class="axis-label" x="${point.x}" y="${height - 12}" text-anchor="middle">${escapeHtml(displayDate(point.fecha_datos).slice(0, 5))}</text>`); });
    const last = points[points.length - 1];
    host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Líneas de deuda y saldo por fecha"><title>Evolución de deuda y saldo</title>${grid}<path class="debt-line" d="${line('deuda_total')}"></path><path class="balance-line" d="${line('saldo_total')}"></path><circle class="latest-dot" cx="${last.x}" cy="${y(value(last.saldo_total))}" r="4"></circle>${labels.join('')}</svg>`;
  }

  function render(data) {
    const summary = data.summary;
    const source = data.source;
    setText('source-file', source.file || summary.file || '—');
    setText('source-date', displayDate(source.date));
    setText('source-status', source.status || '—');
    setText('kpi-suministros', number.format(value(summary.suministros)));
    setText('kpi-deuda', compactMoney(summary.deudaTotal));
    setText('kpi-saldo', compactMoney(summary.saldoTotal));
    setText('kpi-promedio', money.format(value(summary.deudaPromedio)));
    setText('kpi-meses', decimal.format(value(summary.mesesDeudaPromedio)));
    setText('kpi-recuperados', number.format(value(summary.usuariosRecuperados)));
    const history = data.history || [];
    setText('history-summary', `${number.format(history.length)} archivos históricos procesados · último corte ${displayDate(history.at(-1)?.fecha_datos)}`);
    renderTrend(history);
    setText('audit-file', source.file || '—');
    setText('audit-rows', number.format(value(source.importedRows)));
    setText('audit-time', displayDateTime(source.loadedAt));
    setText('audit-generated', displayDateTime(data.generatedAt));

    const select = document.getElementById('province-select');
    const provinces = data.byProvince || [];
    select.innerHTML = '<option value="">Todas las provincias</option>' + provinces.map(row => `<option value="${escapeHtml(row.provincia)}">${escapeHtml(row.provincia)}</option>`).join('');
    const refreshDistribution = () => {
      const selected = select.value;
      renderBars('province-bars', provinces, 'provincia', 'deuda_total', compactMoney, selected);
      renderDistricts(data.topDistricts || [], selected);
    };
    select.addEventListener('change', refreshDistribution);
    refreshDistribution();
    renderBars('category-bars', data.byCategory || [], 'categoria', 'deuda_total', compactMoney);
    renderBars('aging-bars', data.byAging || [], 'tramo', 'deuda_total', compactMoney);
    renderBars('recovery-bars', data.recoveryByProvince || [], 'provincia', 'conexiones_proyecto_inactivas', input => number.format(value(input)));
  }

  async function init() {
    try {
      const response = await fetch(`data/dashboard.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`No se pudo cargar la información (${response.status}).`);
      render(await response.json());
    } catch (error) {
      document.querySelector('main').insertAdjacentHTML('afterbegin', `<div class="panel" role="alert"><strong>No se pudo cargar el tablero.</strong><p class="muted">${escapeHtml(error.message)}</p></div>`);
    }
  }
  init();
})();
