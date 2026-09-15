/**
 * Dynamic Constellation Particle Canvas
 * Renders subtle floating nodes and inter-connected lines matching the presentation accent colors.
 */
(function initConstellationBackground() {
	const canvas = document.getElementById('bg-canvas');
	if (!canvas) return;

	const ctx = canvas.getContext('2d');
	let width = 0;
	let height = 0;
	let dpr = 1;
	let particles = [];
	const particleCount = 70;
	const maxDist = 125;

	function resize() {
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = Math.floor(width * dpr);
		canvas.height = Math.floor(height * dpr);
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function createParticles() {
		particles = [];
		for (let i = 0; i < particleCount; i++) {
			particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				vx: (Math.random() - 0.5) * 0.38,
				vy: (Math.random() - 0.5) * 0.38,
				radius: Math.random() * 1.5 + 1.1,
				alpha: Math.random() * 0.35 + 0.5,
				isAccent: Math.random() > 0.75
			});
		}
	}

	function animate() {
		ctx.clearRect(0, 0, width, height);

		// Draw connecting constellation lines
		for (let i = 0; i < particles.length; i++) {
			const p1 = particles[i];
			for (let j = i + 1; j < particles.length; j++) {
				const p2 = particles[j];
				const dx = p1.x - p2.x;
				const dy = p1.y - p2.y;
				const dist = Math.hypot(dx, dy);
				if (dist < maxDist) {
					const lineAlpha = (1 - dist / maxDist) * 0.24;
					ctx.strokeStyle = 'rgba(12, 183, 242, ' + lineAlpha + ')';
					ctx.lineWidth = 0.8;
					ctx.beginPath();
					ctx.moveTo(p1.x, p1.y);
					ctx.lineTo(p2.x, p2.y);
					ctx.stroke();
				}
			}
		}

		// Update and draw particles
		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];
			p.x += p.vx;
			p.y += p.vy;

			if (p.x < -10) p.x = width + 10;
			else if (p.x > width + 10) p.x = -10;
			if (p.y < -10) p.y = height + 10;
			else if (p.y > height + 10) p.y = -10;

			ctx.shadowBlur = 6;
			ctx.shadowColor = 'rgba(12, 183, 242, 0.75)';
			ctx.fillStyle = p.isAccent
				? 'rgba(215, 245, 255, ' + p.alpha + ')'
				: 'rgba(12, 183, 242, ' + p.alpha + ')';
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.shadowBlur = 0;

		requestAnimationFrame(animate);
	}

	window.addEventListener('resize', () => {
		resize();
		for (let i = 0; i < particles.length; i++) {
			if (particles[i].x > width) particles[i].x = Math.random() * width;
			if (particles[i].y > height) particles[i].y = Math.random() * height;
		}
	});

	resize();
	createParticles();
	requestAnimationFrame(animate);
})();
