<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { page } from '$app/state';
	import { videoReady, videoProgress } from '$lib/intro/gate';

	type IntroCtx = { playing: boolean; done: boolean; revealed: boolean };
	const intro = getContext<IntroCtx>('intro');

	// ---- locked choreography ---------------------------------------------
	// WAWE FILMS (Archivo SemiCondensed caps, centered) over a full-screen
	// oscillating sea while the showreel hero buffers → clean-crested flood
	// covers the text → torn Shopify-style waterline recedes the SAME way it
	// came in, revealing the page. Never backwards, nothing dissolves.
	// ?dir=BTT (tide up the beach, default) | LTR (cinematic wipe).

	const MIN_DISPLAY = 1400; // ~1.4s minimum display (grilled)
	const FALLBACK = 12000; // 12s fallback (grilled)
	const WASH_MS = 1700; // clean-crested flood cover, linear
	const RECEDE_MS = 2400; // torn waterline withdraw, linear

	const prefersReduced =
		typeof window !== 'undefined' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	let booted = $state(intro.done || prefersReduced);
	// Compare flag — read once; a ?dir change needs a reload (shareable URLs).
	let ltr = $state(
		typeof window !== 'undefined' &&
			(page.url.searchParams.get('dir') || 'BTT').toUpperCase() === 'LTR'
	);

	let root: HTMLDivElement;
	let sea: HTMLCanvasElement;
	let flood: HTMLDivElement;
	let edge: HTMLDivElement;
	let edgeSvg: SVGSVGElement;
	let edgeFoam: SVGPathElement;
	let edgeHalo: SVGPathElement;
	let edgeSpray: SVGGElement;
	let crestSvg: SVGSVGElement;
	let crestPath: SVGPathElement;
	let titleEl: HTMLDivElement;
	let meterFill: HTMLDivElement;
	let meterWrap: HTMLDivElement;

	function skip() {
		intro.done = true;
		intro.revealed = true;
		intro.playing = false;
		booted = true;
	}

	if (intro.done || prefersReduced) skip();

	// ---- edge geometry (Shopify torn waterline → seafoam-tweakable) -------
	// 2–3 broad smooth swells across the width; fibrous teeth + spray live in
	// patches only; halo pools thicker in the valleys. Amplitudes are consts
	// so the next pass can push them toward seafoam without restructuring.
	const SWELL_1 = 22;
	const SWELL_2 = 10;
	const TEETH = 9;
	const SPRAY_N = 36;

	const TAU = Math.PI * 2;
	const swell = (a: number, L: number, t: number, s: number) =>
		s * (SWELL_1 * Math.sin((a / L) * TAU * 2 + t * 0.5) +
			SWELL_2 * Math.sin((a / L) * TAU * 3.5 + 1.4 - t * 0.34));
	const patchMask = (a: number) => {
		const m = Math.sin(a * 0.006 + 1.2);
		return m > 0 ? m * m : 0;
	};
	const teeth = (a: number, t: number) =>
		patchMask(a) * (TEETH * Math.sin(a * 0.5 + t * 2.6) + 5 * Math.sin(a * 1.13 - t * 3.4));
	// Deterministic spray seeds (stable across frames, twinkle via time).
	const spraySeeds = Array.from({ length: SPRAY_N }, (_, i) => {
		const h = (n: number) => {
			const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
			return x - Math.floor(x);
		};
		return { u: h(1), v: h(2), r: 1 + h(3) * 1.8, p: h(4) * TAU };
	});

	// Water side is +depth (BTT: below the lip, LTR: right of the lip).
	function depthPath(
		L: number,
		SH: number,
		t: number,
		torn: boolean,
		dy: number,
		vertical: boolean
	): string {
		const mid = SH * 0.62 + dy;
		const pt = (a: number) => mid + swell(a, L, t, 1) + (torn ? teeth(a, t) : 0);
		if (!vertical) {
			let d = `M -12 ${SH + 12} L -12 ${pt(0).toFixed(1)}`;
			for (let a = 0; a <= L + 12; a += 10) d += ` L ${a.toFixed(0)} ${pt(a).toFixed(1)}`;
			return d + ` L ${L + 12} ${SH + 12} Z`;
		}
		let d = `M ${SH + 12} -12 L ${pt(0).toFixed(1)} -12`;
		for (let a = 0; a <= L + 12; a += 10) d += ` L ${pt(a).toFixed(1)} ${a.toFixed(0)}`;
		return d + ` L ${SH + 12} ${L + 12} Z`;
	}

	onMount(() => {
		if (intro.done || prefersReduced) return;
		intro.playing = true;

		const vertical = ltr;
		const t0 = performance.now();
		let ready = false;
		let phase: 'loading' | 'wash' | 'recede' = 'loading';
		let phaseT0 = t0;
		let progress = 0;
		let raf = 0;
		let W = 0;
		let H = 0;

		const unsubReady = videoReady.subscribe((v) => {
			if (v) {
				ready = true;
				progress = 1;
			}
		});
		const unsubProgress = videoProgress.subscribe((v) => {
			if (!ready) progress = v;
		});

		const ctx = sea.getContext('2d')!;
		const sprayDots: SVGCircleElement[] = [];
		for (let i = 0; i < SPRAY_N; i++) {
			const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			c.setAttribute('fill', '#F0E3D1');
			edgeSpray.appendChild(c);
			sprayDots.push(c);
		}

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
			W = root.clientWidth;
			H = root.clientHeight;
			sea.width = Math.max(1, Math.round(W * dpr));
			sea.height = Math.max(1, Math.round(H * dpr));
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			edgeSvg.setAttribute('viewBox', vertical ? `0 0 150 ${H}` : `0 0 ${W} 150`);
			crestSvg.setAttribute('viewBox', vertical ? `0 0 90 ${H}` : `0 0 ${W} 90`);
		};
		resize();
		window.addEventListener('resize', resize);

		const setFlood = (px: number) => {
			// px = leading-edge inset from the entry side. Starts > size
			// (off-screen entry, never appears mid-screen) → 0 (full cover).
			flood.style.clipPath = vertical ? `inset(0 ${px}px 0 0)` : `inset(${px}px 0 0 0)`;
		};
		const setRecede = (px: number) => {
			// px = trailing waterline inset from the entry side. 0 → size.
			// The uncovering edge travels the SAME direction the wash came in.
			root.style.clipPath = vertical ? `inset(0 0 0 ${px}px)` : `inset(0 0 ${px}px 0)`;
			if (vertical) edge.style.left = `${px - 34}px`;
			else edge.style.bottom = `${px - 34}px`;
		};
		// Park the flood fully off-screen before the first frame.
		setFlood((vertical ? W : H) * 1.35);

		const WAWE = '#0E438E';
		const WASH = '#2E6BB8';

		function drawSea(t: number) {
			const g = vertical
				? ctx.createLinearGradient(0, 0, W, 0)
				: ctx.createLinearGradient(0, H, 0, 0);
			g.addColorStop(0, '#0B3572');
			g.addColorStop(0.45, WAWE);
			g.addColorStop(1, WASH);
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, W, H);

			// Loading bands: oscillate back and forth, zero net travel.
			const crossLen = vertical ? H : W;
			const travelLen = vertical ? W : H;
			for (let i = 0; i < 4; i++) {
				const frac = 0.18 + i * 0.21;
				const wob = Math.sin(t * 0.6 + i * 1.7) * travelLen * 0.055;
				const amp = crossLen * 0.018 + 6;
				ctx.beginPath();
				const steps = 48;
				for (let s = 0; s <= steps; s++) {
					const a = (s / steps) * crossLen;
					const off =
						Math.sin((a / crossLen) * TAU * 2 + t * 0.8 + i) * amp +
						Math.sin((a / crossLen) * TAU * 5 - t * 1.1 + i * 2) * amp * 0.35;
					const p = frac * travelLen + wob + off;
					const x = vertical ? p : a;
					const y = vertical ? a : p;
					if (s === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
				ctx.strokeStyle = i % 2 ? 'rgba(240,227,209,0.16)' : 'rgba(240,227,209,0.30)';
				ctx.lineWidth = i % 2 ? 7 : 2.5;
				ctx.stroke();
			}
			// Faint travelling shimmer so the hold doesn't feel frozen.
			ctx.fillStyle = 'rgba(255,255,255,0.05)';
			const sx = ((t * 40) % (W + 300)) - 150;
			ctx.fillRect(sx - 60, 0, 60, H);
			ctx.fillRect(sx + 40, 0, 24, H);
		}

		function drawEdges(t: number) {
			const cross = vertical ? H : W;
			// Crest: clean smooth lip riding the flood's leading edge.
			crestPath.setAttribute('d', depthPath(cross, 90, t, false, 0, vertical));
			// Recede: torn waterline — halo pools thicker in the valleys.
			edgeHalo.setAttribute('d', depthPath(cross, 150, t, true, 14, vertical));
			edgeFoam.setAttribute('d', depthPath(cross, 150, t, true, 0, vertical));
			const mid = 150 * 0.62;
			for (let i = 0; i < SPRAY_N; i++) {
				const s = spraySeeds[i];
				const a = s.u * cross;
				const c = sprayDots[i];
				if (patchMask(a) < 0.35) {
					c.setAttribute('opacity', '0');
					continue;
				}
				const depth = mid + swell(a, cross, t, 1) + teeth(a, t) - 6 - s.v * 44;
				const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 2 + s.p));
				if (vertical) {
					c.setAttribute('cx', depth.toFixed(1));
					c.setAttribute('cy', a.toFixed(1));
				} else {
					c.setAttribute('cx', a.toFixed(1));
					c.setAttribute('cy', depth.toFixed(1));
				}
				c.setAttribute('r', s.r.toFixed(2));
				c.setAttribute('opacity', (tw * 0.9).toFixed(2));
			}
		}

		const frame = (now: number) => {
			raf = requestAnimationFrame(frame);
			const t = (now - t0) / 1000;
			const size = vertical ? W : H;

			if (phase === 'loading') {
				drawSea(t);
				meterFill.style.transform = `scaleX(${progress.toFixed(3)})`;
				const elapsed = now - t0;
				if (((ready || progress >= 1) && elapsed >= MIN_DISPLAY) || elapsed >= FALLBACK) {
					phase = 'wash';
					phaseT0 = now;
				}
			} else if (phase === 'wash') {
				const u = Math.min(1, (now - phaseT0) / WASH_MS);
				// Front travels entry → far side, starting 0.35S off-screen.
				const front = size * 1.35 - u * size * 1.4;
				setFlood(Math.max(0, front));
				drawSea(t);
				drawEdges(t);
				meterWrap.style.opacity = '0';
				// Title latches away once the flood has it.
				const covered = front < size * 0.4;
				titleEl.style.opacity = covered ? '0' : '1';
				if (u >= 1) {
					phase = 'recede';
					phaseT0 = now;
					intro.revealed = true;
					edge.style.opacity = '1';
				}
			} else {
				const u = Math.min(1, (now - phaseT0) / RECEDE_MS);
				// Trailing waterline starts where the wash ended and keeps
				// going the SAME direction, off the far side.
				setRecede(u * size * 1.02);
				drawSea(t);
				drawEdges(t);
				if (u >= 1) {
					cancelAnimationFrame(raf);
					intro.done = true;
					intro.playing = false;
					booted = true;
				}
			}
		};

		raf = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			unsubReady();
			unsubProgress();
		};
	});
</script>

{#if !booted}
	<div
		bind:this={root}
		class="fixed inset-0 z-[70] overflow-hidden bg-paper"
		role="status"
		aria-label="Loading showreel"
	>
		<canvas bind:this={sea} class="absolute inset-0 h-full w-full"></canvas>

		<div bind:this={titleEl} class="absolute inset-0 z-10 flex flex-col items-center justify-center transition-opacity duration-200">
			<h1
				class="stretch-semi text-center font-sans uppercase"
				style="font-weight: 600; letter-spacing: 0.18em; font-size: clamp(2.75rem, 9vw, 7.5rem); color: #F0E3D1; text-shadow: 0 2px 30px rgba(10,31,56,0.35);"
			>
				WAWE Films
			</h1>
			<div bind:this={meterWrap} class="mt-6 flex flex-col items-center gap-2 transition-opacity duration-300">
				<span class="text-[11px] font-medium uppercase" style="letter-spacing: 0.32em; color: rgba(240,227,209,0.75);">
					Loading showreel
				</span>
				<div class="h-px w-32 overflow-hidden" style="background: rgba(240,227,209,0.25);">
					<div bind:this={meterFill} class="h-full w-full origin-left" style="background: #F0E3D1; transform: scaleX(0);"></div>
				</div>
			</div>
		</div>

		<div
			bind:this={flood}
			class="absolute inset-0 z-20 will-change-[clip-path]"
			style={ltr
				? 'clip-path: inset(0 100% 0 0); background: linear-gradient(to right, #0B3572 0%, #0E438E 45%, #2E6BB8 100%);'
				: 'clip-path: inset(100% 0 0 0); background: linear-gradient(to top, #0B3572 0%, #0E438E 45%, #2E6BB8 100%);'}
		>
			<svg
				bind:this={crestSvg}
				class={ltr
					? 'absolute top-0 bottom-0 right-0 h-full w-[90px] translate-x-1/2'
					: 'absolute left-0 right-0 top-0 h-[90px] w-full -translate-y-1/2'}
				viewBox="0 0 100 90"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path bind:this={crestPath} d="" fill="#F0E3D1"></path>
			</svg>
		</div>

		<div
			bind:this={edge}
			class={ltr
				? 'absolute inset-y-0 left-0 z-30 w-[150px] opacity-0'
				: 'absolute inset-x-0 bottom-0 z-30 h-[150px] opacity-0'}
		>
			<svg
				bind:this={edgeSvg}
				class="absolute inset-0 h-full w-full"
				viewBox="0 0 100 150"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<path bind:this={edgeHalo} d="" fill="#FFFFFF" opacity="0.55" style="filter: blur(12px);"></path>
				<path bind:this={edgeFoam} d="" fill="#F0E3D1"></path>
				<g bind:this={edgeSpray}></g>
			</svg>
		</div>
	</div>
{/if}

<style>
	.stretch-semi {
		font-stretch: 87.5%;
	}
</style>
