/**
 * MongoDB Pipeline Explorer - APM Inversiones EIRL
 * Vertical Navigation Cards & Interactive Code Panes
 */

document.addEventListener('DOMContentLoaded', () => {
	initPipelineExplorer();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
	setTimeout(initPipelineExplorer, 100);
}

function initPipelineExplorer() {
	const container = document.getElementById('pipeline-explorer');
	if (!container || container.dataset.initialized) return;
	container.dataset.initialized = 'true';

	// Prevent Reveal.js from capturing scroll, click, or keystrokes inside the explorer
	['keydown', 'keyup', 'keypress', 'pointerdown', 'mousedown', 'touchstart'].forEach(type => {
		container.addEventListener(type, (e) => {
			e.stopPropagation();
		}, { passive: true });
	});

	const cards = container.querySelectorAll('.pipeline-card');
	const panes = container.querySelectorAll('.pipeline-pane');

	cards.forEach(card => {
		card.addEventListener('click', () => {
			const targetId = card.dataset.target;
			if (!targetId) return;

			// Switch active card
			cards.forEach(c => c.classList.remove('active'));
			card.classList.add('active');

			// Switch active code pane
			panes.forEach(pane => {
				if (pane.id === `pane-${targetId}`) {
					pane.classList.add('active');
				} else {
					pane.classList.remove('active');
				}
			});
		});
	});
}
