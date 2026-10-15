// Bound SSR content requests too: the browser's landing fallback cannot run
// until +page.server has returned. Callers retain their existing empty-state handling.
export function fetchCMS(url: string, init: RequestInit = {}): Promise<Response> {
	const deadline = AbortSignal.timeout(8000);
	return fetch(url, {
		...init,
		signal: init.signal ? AbortSignal.any([init.signal, deadline]) : deadline
	});
}
