/**
 * Calculadora Predictiva de Practicantes - APM Inversiones EIRL
 * Desarrollo Técnico de la Fase 3 · Big Data y Análisis de Datos (SENATI)
 */

document.addEventListener('DOMContentLoaded', () => {
	initPredictiveCalculator();
});

// Fallback in case DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
	setTimeout(initPredictiveCalculator, 100);
}

function initPredictiveCalculator() {
	const container = document.getElementById('pred-calculator');
	if (!container || container.dataset.initialized) return;
	container.dataset.initialized = 'true';

	// Prevent Reveal.js from capturing slider or button keystrokes/touches
	['keydown', 'keyup', 'keypress', 'pointerdown', 'mousedown', 'touchstart'].forEach(type => {
		container.addEventListener(type, (e) => {
			e.stopPropagation();
		}, { passive: true });
	});

	// Active Model State: 'continuidad' (P1) | 'desempeno' (P2)
	let currentModel = 'continuidad';

	// Model 1 State (Continuidad Semestral)
	const stateP1 = {
		nota: 15.0,
		horasPct: 90,
		faltas: 0,
		justificacion: 'academica',
		incidentes: 0
	};

	// Model 2 State (Riesgo Bajo Desempeño Mensual)
	const stateP2 = {
		horasSemanales: 34,
		faltas: 1,
		justificacion: 'academica',
		incidentes: 0
	};

	// DOM Elements - Inputs
	const sliderNota = document.getElementById('calc-nota');
	const valNota = document.getElementById('calc-val-nota');
	const fieldNota = document.getElementById('calc-field-nota');

	const sliderHoras = document.getElementById('calc-horas');
	const labelHoras = document.getElementById('calc-label-horas');
	const valHoras = document.getElementById('calc-val-horas');

	const sliderFaltas = document.getElementById('calc-faltas');
	const valFaltas = document.getElementById('calc-val-faltas');

	const justifButtons = document.querySelectorAll('.calc-justif-btn');
	const incidentesButtons = document.querySelectorAll('.calc-inc-btn');

	// DOM Elements - Tabs & Presets
	const tabContinuidad = document.getElementById('tab-continuidad');
	const tabDesempeno = document.getElementById('tab-desempeno');
	const presetDestacado = document.getElementById('preset-destacado');
	const presetSeguimiento = document.getElementById('preset-seguimiento');
	const presetRiesgo = document.getElementById('preset-riesgo');

	// DOM Elements - Outputs
	const metricTitle = document.getElementById('calc-metric-title');
	const metricNumber = document.getElementById('calc-metric-number');
	const progressBar = document.getElementById('calc-progress-bar');
	const badgePrediction = document.getElementById('calc-badge-prediction');
	const badgeLevel = document.getElementById('calc-badge-level');
	const actionBadge = document.getElementById('calc-action-badge');
	const actionDesc = document.getElementById('calc-action-desc');
	const formulaCode = document.getElementById('calc-formula-code');
	const formulaDesc = document.getElementById('calc-formula-desc');

	const subcard1Title = document.getElementById('calc-sub1-title');
	const subcard1Val = document.getElementById('calc-sub1-val');
	const subcard2Title = document.getElementById('calc-sub2-title');
	const subcard2Val = document.getElementById('calc-sub2-val');

	// Tab Switchers
	tabContinuidad?.addEventListener('click', () => {
		currentModel = 'continuidad';
		tabContinuidad.classList.add('active');
		tabDesempeno?.classList.remove('active');
		syncInputsForModel();
		calculate();
	});

	tabDesempeno?.addEventListener('click', () => {
		currentModel = 'desempeno';
		tabDesempeno.classList.add('active');
		tabContinuidad?.classList.remove('active');
		syncInputsForModel();
		calculate();
	});

	function syncInputsForModel() {
		if (currentModel === 'continuidad') {
			fieldNota.style.display = 'flex';
			labelHoras.textContent = 'Cumplimiento de Horas (% del Periodo)';
			sliderHoras.min = '40';
			sliderHoras.max = '110';
			sliderHoras.step = '1';
			sliderHoras.value = stateP1.horasPct;
			valHoras.textContent = `${stateP1.horasPct}%`;

			sliderFaltas.value = stateP1.faltas;
			valFaltas.textContent = `${stateP1.faltas} falta${stateP1.faltas !== 1 ? 's' : ''}`;

			setActivePill(justifButtons, stateP1.justificacion);
			setActivePill(incidentesButtons, String(stateP1.incidentes));
		} else {
			fieldNota.style.display = 'none';
			labelHoras.textContent = 'Horas Semanales Promedio (Mes Anterior)';
			sliderHoras.min = '15';
			sliderHoras.max = '45';
			sliderHoras.step = '1';
			sliderHoras.value = stateP2.horasSemanales;
			valHoras.textContent = `${stateP2.horasSemanales} hrs/sem`;

			sliderFaltas.value = stateP2.faltas;
			valFaltas.textContent = `${stateP2.faltas} falta${stateP2.faltas !== 1 ? 's' : ''}`;

			setActivePill(justifButtons, stateP2.justificacion);
			setActivePill(incidentesButtons, String(stateP2.incidentes));
		}
	}

	function setActivePill(nodeList, value) {
		nodeList.forEach(btn => {
			if (btn.dataset.val === value) {
				btn.classList.add('selected');
			} else {
				btn.classList.remove('selected');
			}
		});
	}

	// Sliders Listeners
	sliderNota?.addEventListener('input', (e) => {
		stateP1.nota = parseFloat(e.target.value);
		valNota.textContent = `${stateP1.nota.toFixed(1)} / 20`;
		calculate();
	});

	sliderHoras?.addEventListener('input', (e) => {
		const val = parseInt(e.target.value, 10);
		if (currentModel === 'continuidad') {
			stateP1.horasPct = val;
			valHoras.textContent = `${val}%`;
		} else {
			stateP2.horasSemanales = val;
			valHoras.textContent = `${val} hrs/sem`;
		}
		calculate();
	});

	sliderFaltas?.addEventListener('input', (e) => {
		const val = parseInt(e.target.value, 10);
		if (currentModel === 'continuidad') {
			stateP1.faltas = val;
		} else {
			stateP2.faltas = val;
		}
		valFaltas.textContent = `${val} falta${val !== 1 ? 's' : ''}`;
		calculate();
	});

	// Pill Options Listeners
	justifButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			justifButtons.forEach(b => b.classList.remove('selected'));
			btn.classList.add('selected');
			const val = btn.dataset.val;
			if (currentModel === 'continuidad') {
				stateP1.justificacion = val;
			} else {
				stateP2.justificacion = val;
			}
			calculate();
		});
	});

	incidentesButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			incidentesButtons.forEach(b => b.classList.remove('selected'));
			btn.classList.add('selected');
			const val = parseInt(btn.dataset.val, 10);
			if (currentModel === 'continuidad') {
				stateP1.incidentes = val;
			} else {
				stateP2.incidentes = val;
			}
			calculate();
		});
	});

	// Presets
	presetDestacado?.addEventListener('click', () => {
		if (currentModel === 'continuidad') {
			stateP1.nota = 18.0;
			stateP1.horasPct = 100;
			stateP1.faltas = 0;
			stateP1.justificacion = 'academica';
			stateP1.incidentes = 0;
			sliderNota.value = '18.0';
			valNota.textContent = '18.0 / 20';
		} else {
			stateP2.horasSemanales = 38;
			stateP2.faltas = 0;
			stateP2.justificacion = 'academica';
			stateP2.incidentes = 0;
		}
		syncInputsForModel();
		calculate();
	});

	presetSeguimiento?.addEventListener('click', () => {
		if (currentModel === 'continuidad') {
			stateP1.nota = 13.5;
			stateP1.horasPct = 85;
			stateP1.faltas = 1;
			stateP1.justificacion = 'personal';
			stateP1.incidentes = 0;
			sliderNota.value = '13.5';
			valNota.textContent = '13.5 / 20';
		} else {
			stateP2.horasSemanales = 30;
			stateP2.faltas = 2;
			stateP2.justificacion = 'personal';
			stateP2.incidentes = 0;
		}
		syncInputsForModel();
		calculate();
	});

	presetRiesgo?.addEventListener('click', () => {
		if (currentModel === 'continuidad') {
			stateP1.nota = 10.0;
			stateP1.horasPct = 68;
			stateP1.faltas = 4;
			stateP1.justificacion = 'sin_justificar';
			stateP1.incidentes = 1;
			sliderNota.value = '10.0';
			valNota.textContent = '10.0 / 20';
		} else {
			stateP2.horasSemanales = 22;
			stateP2.faltas = 4;
			stateP2.justificacion = 'sin_justificar';
			stateP2.incidentes = 1;
		}
		syncInputsForModel();
		calculate();
	});

	// Sigmoid mathematical activation
	function sigmoid(z) {
		return 1 / (1 + Math.exp(-z));
	}

	// Main Calculation Engine
	function calculate() {
		if (currentModel === 'continuidad') {
			calculateContinuidad();
		} else {
			calculateDesempeno();
		}
	}

	function calculateContinuidad() {
		// Justification weight lookup
		const justifWeights = {
			academica: 0.45,
			medica: 0.35,
			personal: -0.25,
			sin_justificar: -0.85
		};

		const b0 = 0.5;
		const deltaNota = (stateP1.nota - 12.5) * 0.42;
		const deltaHoras = (stateP1.horasPct - 82) * 0.055;
		let penaltyFaltas = stateP1.faltas * 0.72;
		// MongoDB insight: 3+ unexcused absences trigger disproportionate risk of attrition
		if (stateP1.faltas >= 3) {
			penaltyFaltas += 0.95;
		}
		const penaltyIncidentes = stateP1.incidentes === 1 ? 1.35 : 0;
		const effectJustif = justifWeights[stateP1.justificacion] || 0;

		const z = b0 + deltaNota + deltaHoras - penaltyFaltas - penaltyIncidentes + effectJustif;
		const prob = Math.min(Math.max(sigmoid(z) * 100, 1.2), 99.4);
		const probRounded = Math.round(prob);

		metricTitle.textContent = 'Probabilidad de Continuidad al Siguiente Semestre';
		metricNumber.textContent = `${probRounded}%`;
		progressBar.style.width = `${probRounded}%`;

		// Set dynamic styling colors based on Power BI thresholds:
		// Alta (> 70%), Media (30% - 70%), Baja (< 30%)
		let color, glow, levelText, actionTitle, actionText, predBinary;

		if (prob >= 70) {
			color = '#10b981'; // Green
			glow = 'rgba(16, 185, 129, 0.4)';
			levelText = 'Alta (> 70%)';
			predBinary = '1 · Continuará';
			actionTitle = 'Priorizar oferta de continuidad';
			actionText = 'Contactar de inmediato al practicante para confirmar su disponibilidad e iniciar la reserva de cupo formal para el siguiente semestre.';
		} else if (prob >= 30) {
			color = '#f59e0b'; // Amber
			glow = 'rgba(245, 158, 11, 0.4)';
			levelText = 'Media (30% - 70%)';
			predBinary = 'En evaluación (Seguimiento)';
			actionTitle = 'Realizar seguimiento activo';
			actionText = 'Evaluar causas de faltas o desfase de horas. Brindar feedback técnico con el tutor para mejorar la retención antes del cierre de ciclo.';
		} else {
			color = '#ef4444'; // Red
			glow = 'rgba(239, 68, 68, 0.4)';
			levelText = 'Baja (< 30%)';
			predBinary = '0 · No continuará';
			actionTitle = 'Planificar reemplazo';
			actionText = 'Baja probabilidad de permanencia. Iniciar anticipadamente el proceso de reclutamiento y selección para cubrir oportunamente la vacante.';
		}

		container.style.setProperty('--metric-color', color);
		container.style.setProperty('--metric-glow', glow);
		container.style.setProperty('--level-bg', `${color}22`);
		container.style.setProperty('--level-border', color);
		container.style.setProperty('--level-text', color);

		badgePrediction.innerHTML = `<strong>Predicción:</strong> ${predBinary}`;
		badgeLevel.innerHTML = `<strong>Rango:</strong> ${levelText}`;
		actionBadge.textContent = actionTitle;
		actionDesc.textContent = actionText;

		formulaCode.textContent = `z = 0.5 + 0.42·(Nota-12.5) + 0.055·(Horas-82) - ${penaltyFaltas.toFixed(2)} [Faltas] - ${penaltyIncidentes.toFixed(2)} [Inc] + ${effectJustif.toFixed(2)} [Justif] = ${z.toFixed(2)}`;
		formulaDesc.textContent = `P(Continuar) = 1 / (1 + e^(-z)) = ${prob.toFixed(1)}%`;

		// Subcards info
		subcard1Title.textContent = 'Horas Cumplidas vs Meta';
		subcard1Val.textContent = `${stateP1.horasPct}% (${Math.round(stateP1.horasPct * 5.76)} hrs)`;
		subcard2Title.textContent = 'Impacto Disciplinario';
		subcard2Val.textContent = stateP1.faltas >= 3 ? 'Crítico (≥3 faltas)' : (stateP1.incidentes ? 'Advertencia' : 'Limpio');
	}

	function calculateDesempeno() {
		const justifWeights = {
			academica: -0.4,
			medica: -0.3,
			personal: 0.35,
			sin_justificar: 0.9
		};

		const b0 = -0.7;
		const deltaHoras = -(stateP2.horasSemanales - 32) * 0.085;
		const faltasImpact = stateP2.faltas * 0.68;
		const incidentesImpact = stateP2.incidentes === 1 ? 1.4 : 0;
		const effectJustif = justifWeights[stateP2.justificacion] || 0;

		const z = b0 + deltaHoras + faltasImpact + incidentesImpact + effectJustif;
		const prob = Math.min(Math.max(sigmoid(z) * 100, 1.5), 98.8);
		const probRounded = Math.round(prob);

		metricTitle.textContent = 'Riesgo de Bajo Desempeño el Próximo Mes';
		metricNumber.textContent = `${probRounded}%`;
		progressBar.style.width = `${probRounded}%`;

		let color, glow, levelText, actionTitle, actionText, predBinary;

		if (prob >= 50) {
			color = '#ef4444'; // High risk
			glow = 'rgba(239, 68, 68, 0.4)';
			levelText = 'Riesgo Alto (Alerta)';
			predBinary = '1 · Tendrá bajo desempeño (≤10/20)';
			actionTitle = 'Intervención y Tutoría Inmediata';
			actionText = 'El modelo alerta que el practicante tiene alta probabilidad de reprobar o promediar ≤ 10 en el siguiente mes. Intervenir preventivamente.';
		} else if (prob >= 25) {
			color = '#f59e0b';
			glow = 'rgba(245, 158, 11, 0.4)';
			levelText = 'Riesgo Moderado';
			predBinary = '0 · Desempeño vulnerable';
			actionTitle = 'Refuerzo y Monitoreo Semanal';
			actionText = 'Riesgo latente de caída en notas. Programar sesiones de apoyo en dudas técnicas para asegurar cumplimiento de tareas.';
		} else {
			color = '#10b981';
			glow = 'rgba(16, 185, 129, 0.4)';
			levelText = 'Riesgo Bajo (Controlado)';
			predBinary = '0 · Desempeño Normal o Alto (>10/20)';
			actionTitle = 'Desempeño Estable';
			actionText = 'Comportamiento dentro de parámetros esperados. Continuar con la rutina normal de entregables y mentoría regular.';
		}

		container.style.setProperty('--metric-color', color);
		container.style.setProperty('--metric-glow', glow);
		container.style.setProperty('--level-bg', `${color}22`);
		container.style.setProperty('--level-border', color);
		container.style.setProperty('--level-text', color);

		badgePrediction.innerHTML = `<strong>Predicción:</strong> ${predBinary}`;
		badgeLevel.innerHTML = `<strong>Nivel:</strong> ${levelText}`;
		actionBadge.textContent = actionTitle;
		actionDesc.textContent = actionText;

		formulaCode.textContent = `z = -0.7 - 0.085·(Horas-32) + ${faltasImpact.toFixed(2)} [Faltas] + ${incidentesImpact.toFixed(2)} [Inc] + ${effectJustif.toFixed(2)} [Justif] = ${z.toFixed(2)}`;
		formulaDesc.textContent = `P(Bajo Desempeño) = 1 / (1 + e^(-z)) = ${prob.toFixed(1)}%`;

		subcard1Title.textContent = 'Déficit Estimado de Horas';
		const horasDeficit = Math.max(0, 36 - stateP2.horasSemanales);
		subcard1Val.textContent = horasDeficit > 0 ? `-${horasDeficit} hrs/semana` : 'Sin déficit (cumple)';
		subcard2Title.textContent = 'Alerta Temprana';
		subcard2Val.textContent = prob >= 50 ? 'Activada (Prioridad Alta)' : 'Normal';
	}

	// Initial trigger
	syncInputsForModel();
	calculate();
}
