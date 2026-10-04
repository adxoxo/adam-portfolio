<script lang="ts">
	let canvas = $state<HTMLCanvasElement>();

	$effect(() => {
		const cv = canvas;
		if (!cv) return;
		const ctx = cv.getContext('2d');
		if (!ctx) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const LINK = 155,
			MR = 175,
			acc = '#4f7a52';
		let W = 0,
			H = 0,
			rafId = 0;
		let nodes: { x: number; y: number; vx: number; vy: number }[] = [];
		const mouse = { x: -999, y: -999 };

		const size = () => {
			const r = cv.getBoundingClientRect();
			W = r.width;
			H = r.height;
			cv.width = W * dpr;
			cv.height = H * dpr;
			ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
			const n = Math.max(46, Math.min(150, Math.round((W * H) / 9000)));
			nodes = [];
			for (let i = 0; i < n; i++)
				nodes.push({
					x: Math.random() * W,
					y: Math.random() * H,
					vx: (Math.random() - 0.5) * 0.24,
					vy: (Math.random() - 0.5) * 0.24
				});
		};
		function tick() {
			ctx!.clearRect(0, 0, W, H);
			for (let i = 0; i < nodes.length; i++) {
				const a = nodes[i];
				a.x += a.vx;
				a.y += a.vy;
				if (a.x < 0 || a.x > W) a.vx *= -1;
				if (a.y < 0 || a.y > H) a.vy *= -1;
				for (let j = i + 1; j < nodes.length; j++) {
					const b = nodes[j];
					const d = Math.hypot(a.x - b.x, a.y - b.y);
					if (d < LINK) {
						ctx!.strokeStyle = acc;
						ctx!.globalAlpha = (1 - d / LINK) * 0.28;
						ctx!.lineWidth = 1;
						ctx!.beginPath();
						ctx!.moveTo(a.x, a.y);
						ctx!.lineTo(b.x, b.y);
						ctx!.stroke();
					}
				}
				const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
				if (md < MR) {
					ctx!.strokeStyle = acc;
					ctx!.globalAlpha = (1 - md / MR) * 0.6;
					ctx!.lineWidth = 1.2;
					ctx!.beginPath();
					ctx!.moveTo(a.x, a.y);
					ctx!.lineTo(mouse.x, mouse.y);
					ctx!.stroke();
				}
				ctx!.globalAlpha = md < MR ? 0.85 : 0.45;
				ctx!.fillStyle = acc;
				ctx!.beginPath();
				ctx!.arc(a.x, a.y, md < MR ? 2.8 : 1.9, 0, 6.29);
				ctx!.fill();
			}
			ctx!.globalAlpha = 1;
			rafId = requestAnimationFrame(tick);
		}
		const onMove = (e: PointerEvent) => {
			const r = cv.getBoundingClientRect();
			mouse.x = e.clientX - r.left;
			mouse.y = e.clientY - r.top;
		};
		const onLeave = () => {
			mouse.x = -999;
			mouse.y = -999;
		};
		let rt: ReturnType<typeof setTimeout>;
		const onResize = () => {
			clearTimeout(rt);
			rt = setTimeout(size, 150);
		};
		cv.addEventListener('pointermove', onMove);
		cv.addEventListener('pointerleave', onLeave);
		window.addEventListener('resize', onResize);
		size();
		if (reduce) {
			ctx.fillStyle = acc;
			ctx.globalAlpha = 0.32;
			nodes.forEach((a) => {
				ctx.beginPath();
				ctx.arc(a.x, a.y, 1.9, 0, 6.29);
				ctx.fill();
			});
			ctx.globalAlpha = 1;
		} else {
			rafId = requestAnimationFrame(tick);
		}
		return () => {
			cancelAnimationFrame(rafId);
			clearTimeout(rt);
			cv.removeEventListener('pointermove', onMove);
			cv.removeEventListener('pointerleave', onLeave);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<canvas class="hero-canvas" bind:this={canvas} aria-hidden="true"></canvas>
