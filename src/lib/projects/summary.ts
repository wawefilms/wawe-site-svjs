/** Suppress only observed editorial placeholders; never invent replacement project copy. */
export function displaySummary(value: string | null | undefined): string | null {
	const text = value?.trim();
	if (!text || /^(?:s{4,}|SCaxc|\.{2,})$/i.test(text)) return null;
	return text;
}
