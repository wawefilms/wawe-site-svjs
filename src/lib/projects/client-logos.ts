import { imageURL, type MediaRelationship } from '../media/normalize.ts';
import { clientLogoSource } from '../media/client-logo.ts';
import { CMS_ORIGIN } from '../landing/sources.ts';

// Official artwork fallbacks for exact, verified CMS client names only.
// A logo does not infer a Project relationship or create any Showreel cue.
const officialLogos = new Map([
	['razorpay', '/clients/razorpay-white.png'],
	['outskill', '/clients/outskill-paper.png'],
	['wispr flow', '/clients/wispr-flow-paper.png']
]);

export function officialClientLogo(title: string): string | null {
	return officialLogos.get(title.trim().toLowerCase()) ?? null;
}

export function clientLogo(title: string, logo: MediaRelationship): string | null {
	if (logo && typeof logo === 'object') {
		const published = clientLogoSource(logo.url ?? '', logo.mimeType ?? '', CMS_ORIGIN);
		if (published) return published;
	}
	if (logo && typeof logo === 'object' && logo.mimeType && /^(image\/(png|jpeg|webp|avif))$/.test(logo.mimeType) && /^\/api\/client-logo\/[1-9]\d*(?:\?asset=[1-9]\d*)?$/.test(logo.url ?? '')) return logo.url ?? null;
	return imageURL(logo) ?? officialLogos.get(title.trim().toLowerCase()) ?? null;
}
