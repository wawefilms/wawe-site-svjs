export const EXPAND_DURATION = 320;
export const REORDER_DURATION = 240;
export const REVEAL_EASING = 'cubic-bezier(.22,1,.36,1)';

/** Serializes a measured layout update. The height itself moves following sections. */
export function createSectionTransition(section: HTMLElement, content: HTMLElement) {
	let animation: Animation | null = null;
	let busy = false;
	let disposed = false;
	let targetHeight = 0;
	let restore: (() => void) | null = null;

	function finish() {
		animation?.cancel();
		animation = null;
		restore?.();
		restore = null;
	}

	return {
		get busy() { return busy; },
		async run(update: () => void, settled: () => Promise<void>, reduced: boolean): Promise<boolean> {
			if (busy || disposed) return false;
			busy = true;
			const before = section.getBoundingClientRect().height;
			try {
				update();
				await settled();
				if (disposed) return false;
				targetHeight = section.getBoundingClientRect().height;
				if (reduced || !section.animate || Math.abs(before - targetHeight) < 1) return true;
				const previous = { height: section.style.height, overflow: section.style.overflow, anchor: section.style.overflowAnchor };
				restore = () => {
					section.style.height = previous.height;
					section.style.overflow = previous.overflow;
					section.style.overflowAnchor = previous.anchor;
				};
				section.style.height = `${targetHeight}px`;
				section.style.overflow = 'clip';
				section.style.overflowAnchor = 'none';
				animation = section.animate([{ height: `${before}px` }, { height: `${targetHeight}px` }], { duration: EXPAND_DURATION, easing: REVEAL_EASING });
				await animation.finished.catch(() => undefined);
				return true;
			} finally {
				finish();
				busy = false;
			}
		},
		/** A changed intrinsic height (resize/font/image) ends clipping at the real layout. */
		layoutChanged() {
			if (animation && Math.abs(content.getBoundingClientRect().height - targetHeight) > 1) finish();
		},
		finish,
		dispose() { disposed = true; finish(); }
	};
}
