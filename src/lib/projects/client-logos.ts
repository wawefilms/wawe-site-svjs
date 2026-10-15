import { imageURL, type MediaRelationship } from '../media/normalize.ts';

// Official artwork fallbacks for exact, verified CMS client names only.
// A logo does not infer a Project relationship or create any Showreel cue.
const officialLogos = new Map([
	['razorpay', '/clients/razorpay-white.png'],
	['outskill', '/clients/outskill-paper.png'],
	['wispr flow', '/clients/wispr-flow-paper.png']
]);

export function clientLogo(title: string, logo: MediaRelationship): string | null {
	if (logo && typeof logo === 'object' && logo.mimeType && /^(image\/(png|jpeg|webp|avif))$/.test(logo.mimeType) && /^\/api\/client-logo\/[1-9]\d*(?:\?asset=[1-9]\d*)?$/.test(logo.url ?? '')) return logo.url ?? null;
	return imageURL(logo) ?? officialLogos.get(title.trim().toLowerCase()) ?? null;
}
