/**
 * Fase 4 · Dashboard interactivo de continuidad (Power BI replica)
 * Datos reales anonimizados (P01..P51) calculados desde dump_asistencia.sql
 * con el modelo P1 de continuidad (js/calculator.js).
 */

document.addEventListener('DOMContentLoaded', () => {
	initFase4Dashboard();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
	setTimeout(initFase4Dashboard, 100);
}

function initFase4Dashboard() {
	const container = document.getElementById('fase4-dashboard');
	if (!container || container.dataset.initialized) return;
	container.dataset.initialized = 'true';

	// Prevent Reveal.js from capturing pointer/key events on the dashboard
	['keydown', 'keyup', 'keypress', 'pointerdown', 'mousedown', 'touchstart'].forEach(type => {
		container.addEventListener(type, (e) => {
			e.stopPropagation();
		}, { passive: true });
	});

	const F = window.FASE4;
	if (!F || !F.practicantes || !F.practicantes.length) return;

	const meta = F.meta;
	const practicantes = F.practicantes;

	const N = meta.totalPracticantes;
	const prom = meta.promedioContinuidad;
	const niveles = ['Alta', 'Media', 'Baja'];
	const colors = { Alta: '#22c55e', Media: '#f59e0b', Baja: '#ef4444' };
	const recFont = 'Arial, Helvetica, sans-serif';

	let sortMode = 'rank'; // 'rank' | 'id'
	let selectedId = practicantes[0].id;

	// ---------- Reorganized 3-Panel Layout (strictly bounded) ----------
	container.innerHTML = `
		<!-- Panel 1: Resumen General y Donut -->
		<div class="fase4-panel">
			<p class="fase4-panel-title"><span class="dot"></span>Resumen general</p>
			<div class="fase4-kpis">
				<div class="fase4-kpi" style="--f4-color:#2563eb">
					<div class="fase4-kpi-val" id="f4-kpi-total">${N}</div>
					<div class="fase4-kpi-label">Practicantes activos</div>
				</div>
				<div class="fase4-kpi" style="--f4-color:#0cb7f2">
					<div class="fase4-kpi-val" id="f4-kpi-prom">${String(prom).replace('.', ',')}%</div>
					<div class="fase4-kpi-label">Continuidad promedio</div>
				</div>
				<div class="fase4-kpi" style="--f4-color:#22c55e">
					<div class="fase4-kpi-val" id="f4-kpi-cont">${meta.porNivel.Alta + meta.porNivel.Media}</div>
					<div class="fase4-kpi-label">Continúan / tal vez</div>
				</div>
				<div class="fase4-kpi" style="--f4-color:#ef4444">
					<div class="fase4-kpi-val" id="f4-kpi-no">${meta.porNivel.Baja}</div>
					<div class="fase4-kpi-label">Probablemente no</div>
				</div>
			</div>
			<div class="fase4-donut-wrap"></div>
			<div class="fase4-legend"></div>
		</div>

		<!-- Panel 2: Gráfico de Barras con los 51 practicantes -->
		<div class="fase4-panel">
			<div class="fase4-chart-header">
				<p class="fase4-panel-title"><span class="dot" style="--f4-color:#22c55e"></span>Probabilidad por practicante</p>
				<div class="fase4-chart-tools">
					<button class="fase4-btn-sort active" id="f4-sort-rank" title="Ordenar de mayor a menor">Ranking ↓</button>
					<button class="fase4-btn-sort" id="f4-sort-id" title="Ordenar por identificador P01 a P51">Por ID</button>
				</div>
			</div>
			<div class="fase4-rank-tools">
				<select class="fase4-select" id="f4-select" aria-label="Seleccionar practicante"></select>
			</div>
			<div class="fase4-barchart-wrap" id="f4-barchart-wrap"></div>
			<div class="fase4-chart-legend">
				<div class="fase4-chart-legend-items">
					<div class="fase4-chart-legend-item"><span class="fase4-chart-legend-swatch" style="background:#22c55e"></span>Alta (≥70%)</div>
					<div class="fase4-chart-legend-item"><span class="fase4-chart-legend-swatch" style="background:#f59e0b"></span>Media (30–69%)</div>
					<div class="fase4-chart-legend-item"><span class="fase4-chart-legend-swatch" style="background:#ef4444"></span>Baja (&lt;30%)</div>
				</div>
				<div class="fase4-chart-legend-item" style="color:#0cb7f2">
					<svg width="20" height="6" style="vertical-align:middle"><line x1="0" y1="3" x2="20" y2="3" stroke="#0cb7f2" stroke-dasharray="3,2" stroke-width="1.8"/></svg>
					Promedio cohorte (${String(prom).replace('.', ',')}%)
				</div>
			</div>
		</div>

		<!-- Panel 3: Detalle del Practicante seleccionado -->
		<div class="fase4-panel">
			<p class="fase4-panel-title"><span class="dot" style="--f4-color:#0cb7f2"></span>Detalle del practicante</p>
			<div class="fase4-detail-id" id="f4-detail-id"></div>
			<div class="fase4-detail-gauge"></div>
			<div class="fase4-metrics">
				<div class="fase4-metric"><div class="fase4-metric-label">Nota promedio</div><div class="fase4-metric-val" id="f4-m-nota">—</div></div>
				<div class="fase4-metric"><div class="fase4-metric-label">Horas cumplidas</div><div class="fase4-metric-val" id="f4-m-horas">—</div></div>
				<div class="fase4-metric"><div class="fase4-metric-label">Faltas</div><div class="fase4-metric-val" id="f4-m-faltas">—</div></div>
				<div class="fase4-metric"><div class="fase4-metric-label">Reportes</div><div class="fase4-metric-val" id="f4-m-reportes">—</div></div>
				<div class="fase4-metric"><div class="fase4-metric-label">Días asistidos</div><div class="fase4-metric-val" id="f4-m-dias">—</div></div>
				<div class="fase4-metric"><div class="fase4-metric-label">Horas totales</div><div class="fase4-metric-val" id="f4-m-hrt">—</div></div>
			</div>
			<div class="fase4-rec">
				<div class="fase4-rec-label">Recomendación del modelo</div>
				<div class="fase4-rec-val" id="f4-rec">—</div>
			</div>
		</div>
	`;

	// ---------- Donut (3 niveles) ----------
	const donutWrap = container.querySelector('.fase4-donut-wrap');
	const r = 76, C = 2 * Math.PI * r;
	let filled = 0;
	const segs = niveles
		.filter(nv => meta.porNivel[nv] > 0)
		.map(nv => {
			const val = meta.porNivel[nv];
			const len = (val / N) * C;
			const rot = filled === 0 ? -90 : -90 + (filled / N) * 360;
			filled += val;
			return { nv, val, len, rot, color: colors[nv] };
		});
	donutWrap.innerHTML = `
		<svg class="fase4-donut-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
			${segs.map(s => `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${s.color}" stroke-width="28" stroke-dasharray="${s.len.toFixed(2)} ${(C - s.len).toFixed(2)}" transform="rotate(${s.rot} 100 100)"/>`).join('')}
		</svg>
		<div class="fase4-donut-center">
			<div class="big">${N}</div>
			<div class="small">practicantes</div>
		</div>
	`;

	const legend = container.querySelector('.fase4-legend');
	legend.innerHTML = segs.map(s =>
		`<div class="fase4-legend-row"><span class="fase4-legend-swatch" style="background:${s.color}"></span><span>${s.nv === 'Alta' ? 'Continúa' : s.nv === 'Media' ? 'Tal vez (Media)' : 'Probablemente no'}</span><span class="fase4-legend-val">${s.val} · ${Math.round((s.val / N) * 100)}%</span></div>`
	).join('');

	// ---------- Select Dropdown (Panel 2) ----------
	const select = container.querySelector('#f4-select');
	const sortedForSelect = [...practicantes].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
	sortedForSelect.forEach(p => {
		const opt = document.createElement('option');
		opt.value = p.id;
		opt.textContent = `${p.id} — ${p.prob}% (${p.nivel}) · Nota: ${String(p.nota).replace('.', ',')}`;
		select.appendChild(opt);
	});
	select.value = selectedId;
	select.addEventListener('change', () => selectPractitioner(select.value));

	// ---------- Bar Chart de 51 Practicantes ----------
	const chartWrap = container.querySelector('#f4-barchart-wrap');

	function getSortedPracticantes() {
		if (sortMode === 'rank') {
			return [...practicantes].sort((a, b) => b.prob - a.prob);
		}
		return [...practicantes].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
	}

	function renderBarChart() {
		const currentList = getSortedPracticantes();
		const left = 30, right = 8, top = 22, bottom = 38;
		const W = 720, H = 290;
		const chartW = W - left - right;
		const chartH = H - top - bottom;
		const count = currentList.length;
		const step = chartW / count;
		const barW = 8.8;

		const yAvg = top + chartH * (1 - prom / 100);

		// Grid lines
		const ticks = [0, 25, 50, 75, 100];
		const gridSvg = ticks.map(t => {
			const y = top + chartH * (1 - t / 100);
			return `
				<line x1="${left}" y1="${y}" x2="${left + chartW}" y2="${y}" stroke="#16233d" stroke-dasharray="2,2" stroke-width="1"/>
				<text x="${left - 4}" y="${y + 3}" text-anchor="end" font-size="7.5" fill="#64748b" font-family="${recFont}">${t}%</text>
			`;
		}).join('');

		// Average benchmark line
		const avgSvg = `
			<line x1="${left}" y1="${yAvg}" x2="${left + chartW}" y2="${yAvg}" stroke="#0cb7f2" stroke-dasharray="3,2" stroke-width="1.5"/>
			<rect x="${left + chartW - 95}" y="${yAvg - 13}" width="95" height="13" rx="3" fill="#090e1a" stroke="#0cb7f2" stroke-width="0.8"/>
			<text x="${left + chartW - 47.5}" y="${yAvg - 3.5}" text-anchor="middle" font-size="7.5" font-weight="bold" fill="#0cb7f2" font-family="${recFont}">Prom: ${String(prom).replace('.', ',')}%</text>
		`;

		// Bars
		const barsSvg = currentList.map((p, i) => {
			const x = left + i * step + (step - barW) / 2;
			const h = Math.max(3, (p.prob / 100) * chartH);
			const y = top + chartH - h;
			const isSelected = p.id === selectedId;
			const col = colors[p.nivel];

			let marker = '';
			if (isSelected) {
				marker = `
					<polygon points="${x + barW / 2},${y - 2} ${x + barW / 2 - 2.5},${y - 5.5} ${x + barW / 2 + 2.5},${y - 5.5}" fill="#38bdf8"/>
					<text x="${x + barW / 2}" y="${y - 7}" text-anchor="middle" font-size="7" font-weight="bold" fill="#38bdf8" font-family="${recFont}">${p.prob}%</text>
				`;
			}

			return `
				<g class="f4-bar-group" data-id="${p.id}" style="cursor:pointer">
					<rect class="f4-bar-rect" data-id="${p.id}" x="${x}" y="${y}" width="${barW}" height="${h}" rx="2" fill="${col}"
						${isSelected ? 'stroke="#38bdf8" stroke-width="1.6" style="filter:drop-shadow(0 0 4px #0cb7f2)"' : 'opacity="0.82"'} />
					${marker}
					<text class="f4-bar-label" data-id="${p.id}" x="${x + barW / 2}" y="${top + chartH + 5}"
						transform="rotate(-90 ${x + barW / 2} ${top + chartH + 5})" text-anchor="end" font-size="7"
						font-weight="${isSelected ? 'bold' : 'normal'}" fill="${isSelected ? '#38bdf8' : '#8fa0b5'}" font-family="${recFont}">${p.id}</text>
				</g>
			`;
		}).join('');

		chartWrap.innerHTML = `
			<svg class="fase4-barchart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
				${gridSvg}
				${avgSvg}
				${barsSvg}
			</svg>
		`;
	}

	// Sort buttons
	const btnSortRank = container.querySelector('#f4-sort-rank');
	const btnSortId = container.querySelector('#f4-sort-id');

	btnSortRank.addEventListener('click', () => {
		if (sortMode === 'rank') return;
		sortMode = 'rank';
		btnSortRank.classList.add('active');
		btnSortId.classList.remove('active');
		renderBarChart();
	});

	btnSortId.addEventListener('click', () => {
		if (sortMode === 'id') return;
		sortMode = 'id';
		btnSortId.classList.add('active');
		btnSortRank.classList.remove('active');
		renderBarChart();
	});

	// Bar chart click interaction
	chartWrap.addEventListener('click', (e) => {
		const group = e.target.closest('.f4-bar-group');
		if (group) {
			selectPractitioner(group.dataset.id);
		}
	});

	function selectPractitioner(id) {
		selectedId = id;
		if (select.value !== id) select.value = id;
		renderBarChart();
		renderDetail(id);
	}

	// ---------- Detail Panel ----------
	const detailIdEl = container.querySelector('#f4-detail-id');
	const gaugeWrap = container.querySelector('.fase4-detail-gauge');

	function renderDetail(id) {
		const p = practicantes.find(x => x.id === id);
		if (!p) return;
		const color = colors[p.nivel];

		detailIdEl.innerHTML = `Practicante ${p.id} <span class="fase4-badge ${p.nivel}">${p.nivel}</span>`;

		// Gauge semicircular (representa 0-100)
		const arcR = 64;
		const cx = 85, cy = 85;
		const ang = Math.min(p.prob, 100) / 100 * Math.PI; // 0..180°
		const xEnd = cx + arcR * Math.cos(Math.PI - ang);
		const yEnd = cy - arcR * Math.sin(Math.PI - ang);
		const dArc = `M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 ${ang > Math.PI ? 1 : 0} 1 ${xEnd} ${yEnd}`;
		gaugeWrap.innerHTML = `
			<svg class="fase4-gauge-svg" viewBox="0 0 170 95" xmlns="http://www.w3.org/2000/svg" font-family="${recFont}">
				<path d="M 21 85 A 64 64 0 0 1 149 85" fill="none" stroke="#182642" stroke-width="14" stroke-linecap="round"/>
				<path d="${dArc}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" style="filter:drop-shadow(0 0 5px ${color})"/>
				<text x="85" y="80" text-anchor="middle" font-size="25" font-weight="bold" fill="#ffffff">${p.prob}%</text>
			</svg>
		`;

		document.getElementById('f4-m-nota').textContent = String(p.nota).replace('.', ',');
		document.getElementById('f4-m-horas').textContent = p.horasPct + '%';
		document.getElementById('f4-m-faltas').textContent = p.faltas;
		document.getElementById('f4-m-reportes').textContent = p.reportes;
		document.getElementById('f4-m-dias').textContent = p.diasAsistencia;
		document.getElementById('f4-m-hrt').textContent = p.horasTotales + ' h';
		document.getElementById('f4-rec').textContent = p.recomendacion;
	}

	// Inicializar vista
	selectPractitioner(practicantes[0].id);
}