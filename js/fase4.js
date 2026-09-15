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

	// ---------- Layout: KPI + donut + ranking + detail ----------
	container.innerHTML = `
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

		<div class="fase4-panel">
			<p class="fase4-panel-title"><span class="dot" style="--f4-color:#22c55e"></span>Probabilidad por practicante <em style="text-transform:none;font-weight:600">(clic para seleccionar)</em></p>
			<div class="fase4-rank-tools">
				<select class="fase4-select" id="f4-select" aria-label="Seleccionar practicante"></select>
			</div>
			<ul class="fase4-rank-list" id="f4-rank-list"></ul>
		</div>

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
	const r = 80, C = 2 * Math.PI * r;
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
			${segs.map(s => `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${s.color}" stroke-width="34" stroke-dasharray="${s.len.toFixed(2)} ${(C - s.len).toFixed(2)}" transform="rotate(${s.rot} 100 100)"/>`).join('')}
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

	// ---------- Ranking ----------
	const sorted = [...practicantes].sort((a, b) => b.prob - a.prob);
	const select = container.querySelector('#f4-select');
	sorted.forEach(p => {
		const opt = document.createElement('option');
		opt.value = p.id;
		opt.textContent = `${p.id} — ${p.prob}% (${p.nivel})`;
		select.appendChild(opt);
	});

	const list = container.querySelector('#f4-rank-list');
	function renderRank() {
		list.innerHTML = sorted.map(p => `
			<li class="fase4-rank-item" data-id="${p.id}">
				<span class="fase4-rank-id">${p.id}</span>
				<span class="fase4-rank-bar-track"><span class="fase4-rank-bar" style="width:${p.prob}%;--f4-color:${colors[p.nivel]}"></span></span>
				<span class="fase4-rank-pct">${p.prob}%</span>
			</li>
		`).join('');
	}
	renderRank();

	let selectedId = practicantes[0].id;
	select.value = selectedId;

	function selectPractitioner(id) {
		selectedId = id;
		select.value = id;
		list.querySelectorAll('.fase4-rank-item').forEach(li => {
			li.classList.toggle('selected', li.dataset.id === id);
		});
		renderDetail(id);
	}

	// ---------- Detail ----------
	const detailIdEl = container.querySelector('#f4-detail-id');
	const gaugeWrap = container.querySelector('.fase4-detail-gauge');

	function renderDetail(id) {
		const p = practicantes.find(x => x.id === id);
		if (!p) return;
		const color = colors[p.nivel];

		detailIdEl.innerHTML = `Practicante ${p.id} <span class="fase4-badge ${p.nivel}">${p.nivel}</span>`;

		// Gauge semicircular (representa 0-100)
		const g = 200;
		const arcR = 70;
		const cx = 100, cy = 100;
		const ang = Math.min(p.prob, 100) / 100 * Math.PI; // 0..180°
		const xEnd = cx + arcR * Math.cos(Math.PI - ang);
		const yEnd = cy - arcR * Math.sin(Math.PI - ang);
		const dArc = `M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 ${ang > Math.PI ? 1 : 0} 1 ${xEnd} ${yEnd}`;
		gaugeWrap.innerHTML = `
			<svg class="fase4-gauge-svg" viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg" font-family="${recFont}">
				<path d="M 30 100 A 70 70 0 0 1 170 100" fill="none" stroke="#182642" stroke-width="16" stroke-linecap="round"/>
				<path d="${dArc}" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round" style="filter:drop-shadow(0 0 6px ${color})"/>
				<text x="100" y="92" text-anchor="middle" font-size="30" font-weight="bold" fill="#ffffff">${p.prob}%</text>
			</svg>
			<div class="fase4-gauge-center" style="display:none"></div>
		`;

		document.getElementById('f4-m-nota').textContent = String(p.nota).replace('.', ',');
		document.getElementById('f4-m-horas').textContent = p.horasPct + '%';
		document.getElementById('f4-m-faltas').textContent = p.faltas;
		document.getElementById('f4-m-reportes').textContent = p.reportes;
		document.getElementById('f4-m-dias').textContent = p.diasAsistencia;
		document.getElementById('f4-m-hrt').textContent = p.horasTotales + ' h';
		document.getElementById('f4-rec').textContent = p.recomendacion;
	}

	// ---------- Events ----------
	list.addEventListener('click', (e) => {
		const li = e.target.closest('.fase4-rank-item');
		if (li) selectPractitioner(li.dataset.id);
	});
	select.addEventListener('change', () => selectPractitioner(select.value));

	selectPractitioner(practicantes[0].id);
}