<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let {
		projects = [],
		videoUrls = [] as string[]
	}: {
		projects: { slug: string; title: string }[];
		videoUrls: string[];
	} = $props();

	let container: HTMLDivElement;
	let cleanup: (() => void) | null = null;

	onMount(async () => {
		const THREE = await import('three');
		const paramsMod = await import('./ring/params.js');
		const shaderMod = await import('./shaders/planeShaders.js');
		const utilsMod = await import('./ring/utils.js');

		const params = paramsMod.defaultParams();
		// Use portfolio project count
		params.count = Math.min(videoUrls.length || projects.length || 12, 32);

		let renderer: InstanceType<typeof THREE.WebGLRenderer>;
		try {
			renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		} catch (err) {
			console.error('[viscose] WebGL failed', err);
			return;
		}
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		container.appendChild(renderer.domElement);

		const scene = new THREE.Scene();
		const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);

		const { MAX_PLANES, MAX_LINKS } = shaderMod;
		const blankTexture = () => {
			const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
			t.needsUpdate = true;
			return t;
		};

		const uniforms: Record<string, THREE.IUniform> = {
			uResolution: { value: new THREE.Vector2(1, 1) },
			uSize: { value: new THREE.Vector2(150, 100) },
			uRadius: { value: params.radius },
			uCount: { value: params.count },
			uPos: { value: Array.from({ length: MAX_PLANES }, () => new THREE.Vector2()) },
			uRot: { value: new Float32Array(MAX_PLANES) },
			uScale: {
				value: Array.from({ length: MAX_PLANES }, () => new THREE.Vector4(0, 0, 1, 0))
			},
			uLinkCount: { value: 0 },
			uLinkA: { value: Array.from({ length: MAX_LINKS }, () => new THREE.Vector2()) },
			uLinkB: { value: Array.from({ length: MAX_LINKS }, () => new THREE.Vector2()) },
			uLinkPar: { value: Array.from({ length: MAX_LINKS }, () => new THREE.Vector4()) },
			uK: { value: params.goo },
			uWobble: { value: params.wobble },
			uTime: { value: 0 },
			uColor: { value: new THREE.Color('#0a0a0a') },
			uAtlas: { value: blankTexture() },
			uGrid: { value: new THREE.Vector2(1, 1) },
			uBlend: { value: params.blend },
			uTextured: { value: 0 },
			uBandTop: { value: 0 },
			uBandBottom: { value: 0 },
			uGlass: { value: new THREE.Vector4() },
			uFringe: { value: 0 },
			uSheen: { value: 0 },
			uMouse: { value: new THREE.Vector4() },
			uMelt: { value: new THREE.Vector4() },
			uTagTex: { value: new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1) },
			uTag: { value: new THREE.Vector4() },
			uTagP: { value: new THREE.Vector4() },
			uTagQ: { value: new THREE.Vector4() },
			uPage: { value: new THREE.Color('#fafafa') }
		};

		const mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(1, 1),
			new THREE.ShaderMaterial({
				vertexShader: shaderMod.vertexShader,
				fragmentShader: shaderMod.fragmentShader,
				uniforms,
				transparent: true,
				depthWrite: false
			})
		);
		mesh.renderOrder = 10;
		scene.add(mesh);

		// Video-frame atlas from portfolio videos
		const proxiedUrls = videoUrls.map((u) => {
			try {
				if (new URL(u).origin !== location.origin) return `/api/media-proxy?url=${encodeURIComponent(u)}`;
			} catch {}
			return u;
		});

		// Simple video-frame atlas (sequential, same as before but now for the Viscose ring)
		const CELL_W = 512;
		const CELL_H = Math.round(CELL_W / 1.5);
		const cols = Math.ceil(Math.sqrt(proxiedUrls.length)) || 1;
		const rows = Math.ceil(proxiedUrls.length / cols);
		const atlasCanvas = document.createElement('canvas');
		atlasCanvas.width = cols * CELL_W;
		atlasCanvas.height = rows * CELL_H;
		const atlasCtx = atlasCanvas.getContext('2d')!;
		atlasCtx.fillStyle = '#111';
		atlasCtx.fillRect(0, 0, atlasCanvas.width, atlasCanvas.height);
		const atlasTexture = new THREE.CanvasTexture(atlasCanvas);
		atlasTexture.flipY = false;
		atlasTexture.colorSpace = THREE.NoColorSpace;
		atlasTexture.wrapS = THREE.ClampToEdgeWrapping;
		atlasTexture.wrapT = THREE.ClampToEdgeWrapping;
		atlasTexture.minFilter = THREE.LinearMipmapLinearFilter;
		atlasTexture.magFilter = THREE.LinearFilter;
		atlasTexture.generateMipmaps = true;
		uniforms.uAtlas.value = atlasTexture;
		uniforms.uGrid.value.set(cols, rows);
		uniforms.uTextured.value = 1;

		(async () => {
			for (let i = 0; i < proxiedUrls.length; i++) {
				try {
					const video = document.createElement('video');
					video.crossOrigin = 'anonymous';
					video.muted = true;
					video.playsInline = true;
					video.preload = 'auto';
					video.src = proxiedUrls[i];
					await new Promise<void>((resolve, reject) => {
						const to = setTimeout(() => reject(new Error('timeout')), 10000);
						video.onloadeddata = () => {
							clearTimeout(to);
							resolve();
						};
						video.onerror = () => {
							clearTimeout(to);
							reject(new Error('load error'));
						};
						video.load();
					});
					await new Promise<void>((resolve) => {
						const to = setTimeout(resolve, 2000);
						video.onseeked = () => {
							clearTimeout(to);
							resolve();
						};
						try {
							video.currentTime = 0.5;
						} catch {
							clearTimeout(to);
							resolve();
						}
					});
					const x = (i % cols) * CELL_W;
					const y = Math.floor(i / cols) * CELL_H;
					const scale = Math.max(CELL_W / video.videoWidth, CELL_H / video.videoHeight);
					const dw = video.videoWidth * scale;
					const dh = video.videoHeight * scale;
					atlasCtx.save();
					atlasCtx.beginPath();
					atlasCtx.rect(x, y, CELL_W, CELL_H);
					atlasCtx.clip();
					atlasCtx.drawImage(video, x + (CELL_W - dw) / 2, y + (CELL_H - dh) / 2, dw, dh);
					atlasCtx.restore();
					atlasTexture.needsUpdate = true;
					video.pause();
					video.removeAttribute('src');
					video.load();
				} catch (e) {
					console.warn('[atlas] video', i, e);
				}
			}
			atlasTexture.needsUpdate = true;
		})();

		let viewW = 1;
		let viewH = 1;
		let fit = 1;
		let planeK = 1;
		let radiusK = 1;

		const refit = () => {
			const byW = viewW / Math.max(1, params.refWidth);
			const byH = viewH / Math.max(1, params.refHeight);
			const s = byW * (1 - params.fitHeight) + Math.min(byW, byH) * params.fitHeight;
			fit = Math.min(params.maxScale, Math.max(params.minScale, s));
			const narrow = viewW <= params.narrowAt;
			const tight = viewW <= params.tightAt;
			planeK = narrow ? params.narrowPlane : 1;
			radiusK = (narrow ? params.narrowRadius : 1) * (tight ? params.tightRadius : 1);
		};

		const resize = () => {
			viewW = container.clientWidth;
			viewH = container.clientHeight;
			refit();
			renderer.setSize(viewW, viewH);
			camera.left = -viewW / 2;
			camera.right = viewW / 2;
			camera.top = viewH / 2;
			camera.bottom = -viewH / 2;
			camera.updateProjectionMatrix();
			mesh.scale.set(viewW, viewH, 1);
			uniforms.uResolution.value.set(viewW, viewH);
		};
		resize();
		window.addEventListener('resize', resize);

		const state = { progress: 0, spread: 0, spin: 0 };
		let spinVel = 0;
		let dragging = false;
		const ringCentre = { x: 0, y: 0 };

		let raf = 0;
		let lastT = 0;
		let disposed = false;

		const loop = (t: number) => {
			if (disposed) return;
			raf = requestAnimationFrame(loop);
			const dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 0.016;
			lastT = t;
			uniforms.uTime.value = t / 1000;
			state.progress = Math.min(1, state.progress + dt * 0.5);
			state.spread = utilsMod.smoothstep(0.2, 1, state.progress);
			if (!dragging && Math.abs(spinVel) > 0.001) {
				state.spin += spinVel * dt;
				spinVel *= Math.pow(0.96, dt * 60);
			}
			const posX = params.posX * fit;
			const radius = params.radius * fit * radiusK;
			const planeW = params.planeW * fit * planeK;
			const planeH = params.planeH * fit * planeK;
			uniforms.uSize.value.set(planeW, planeH);
			uniforms.uRadius.value = params.planeRadius * fit * planeK;
			uniforms.uK.value = params.goo;
			uniforms.uWobble.value = params.wobble;
			ringCentre.x = posX - radius * 0.15 * state.spread;
			ringCentre.y = 0;
			for (let i = 0; i < params.count; i++) {
				const slot = utilsMod.signedOffset(i);
				const angle = (slot / params.count) * utilsMod.TAU + state.spin;
				const r = radius * (0.85 + 0.15 * state.spread);
				const x = ringCentre.x + Math.cos(angle) * r;
				const y = ringCentre.y + Math.sin(angle) * r;
				const rot = angle + utilsMod.HALF_PI;
				uniforms.uPos.value[i].set(x, y);
				uniforms.uRot.value[i] = rot;
				const s = state.spread < 0.01 ? 0 : 1 - Math.abs(slot) * 0.02;
				uniforms.uScale.value[i].set(s, s, 1, i);
			}
			uniforms.uCount.value = params.count;
			let linkCount = 0;
			for (let i = 0; i < params.count - 1 && linkCount < 32; i++) {
				const a = i;
				const b = (i + 1) % params.count;
				uniforms.uLinkA.value[linkCount].set(uniforms.uPos.value[a].x, uniforms.uPos.value[a].y);
				uniforms.uLinkB.value[linkCount].set(uniforms.uPos.value[b].x, uniforms.uPos.value[b].y);
				const sep = Math.hypot(
					uniforms.uPos.value[a].x - uniforms.uPos.value[b].x,
					uniforms.uPos.value[a].y - uniforms.uPos.value[b].y
				);
				const v = Math.min(1, sep / 220);
				const w0 = params.threadWidth0 * (1 - v) + params.threadWidth1 * v;
				const dissolved = Math.max(0, (v - (1 - params.threadDissolve)) / params.threadDissolve);
				const radius2 = w0 - dissolved * (w0 + 5);
				if (radius2 > -3) {
					uniforms.uLinkPar.value[linkCount].set(radius2, radius2 * 0.6, 0, params.threadK);
					linkCount++;
				}
			}
			uniforms.uLinkCount.value = linkCount;
			renderer.render(scene, camera);
		};
		raf = requestAnimationFrame(loop);

		const bounds = { left: 0, top: 0 };
		const updateBounds = () => {
			const rect = renderer.domElement.getBoundingClientRect();
			bounds.left = rect.left;
			bounds.top = rect.top;
		};
		updateBounds();
		const onPointerMove = (e: PointerEvent) => {
			const x = e.clientX - bounds.left - viewW / 2;
			const y = -(e.clientY - bounds.top - viewH / 2);
			uniforms.uMouse.value.set(x, y, 1, 0);
		};
		const onPointerDown = () => {
			dragging = true;
			updateBounds();
		};
		const onPointerUp = () => {
			dragging = false;
		};
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			spinVel += e.deltaY * 0.001;
		};
		renderer.domElement.addEventListener('pointermove', onPointerMove);
		renderer.domElement.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('pointerup', onPointerUp);
		renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
		renderer.domElement.addEventListener('click', () => {
			if (Math.abs(spinVel) > 0.05) return;
			const slotAngle = utilsMod.TAU / params.count;
			const frontSlot = Math.round(-state.spin / slotAngle) % params.count;
			const idx = frontSlot < 0 ? frontSlot + params.count : frontSlot;
			const slug = projects[idx]?.slug;
			if (slug) goto(`/project/${slug}`);
		});

		cleanup = () => {
			disposed = true;
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			window.removeEventListener('pointerup', onPointerUp);
			renderer.domElement.removeEventListener('pointermove', onPointerMove);
			renderer.domElement.removeEventListener('pointerdown', onPointerDown);
			renderer.domElement.removeEventListener('wheel', onWheel);
			renderer.dispose();
			try {
				renderer.forceContextLoss();
			} catch {}
			renderer.domElement.remove();
		};
		return () => cleanup?.();
	});
</script>

<div bind:this={container} class="viscose-root"></div>

<style>
	.viscose-root {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
		background: #fafafa;
	}
	.viscose-root :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
	}
</style>
