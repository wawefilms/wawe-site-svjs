import sanitizeHtml from 'sanitize-html';
import type { Project } from '../payload-types.ts';
import { imageURL } from '../media/normalize.ts';
import { sourceURL } from '../landing/sources.ts';

function safeLink(value: string | undefined): string | undefined {
	if (!value || /[\x00-\x20\\]/.test(value) || value.startsWith('//')) return undefined;
	if (/^(?:\/(?!\/)|#)/.test(value)) return value;
	try {
		const url = new URL(value);
		return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) && !url.username && !url.password ? value : undefined;
	} catch { return undefined; }
}
function uploadImage(value: string | undefined): string | null {
	if (!value || !/\.(webp|png|jpe?g|avif)$/i.test(value)) return null;
	return sourceURL(value);
}
/** Explicit markup, URL and upload-origin policies; never trust CMS markup. */
export function sanitizeRichText(value: string | null | undefined): string {
	return sanitizeHtml(value ?? '', {
		allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'hr', 'code', 'pre', 'sub', 'sup'],
		allowedAttributes: { a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt', 'width', 'height', 'loading'] },
		allowedSchemes: ['https', 'http', 'mailto', 'tel'], allowProtocolRelative: false,
		transformTags: {
			a: (_tag, attributes) => {
				const href = safeLink(attributes.href);
				return { tagName: 'a', attribs: { ...(href ? { href } : {}), ...(attributes.title ? { title: attributes.title } : {}), ...(attributes.target === '_blank' ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } };
			},
			img: (_tag, attributes) => {
				const src = uploadImage(attributes.src);
				const dimensions = Object.fromEntries(['width', 'height'].flatMap(key => /^\d{1,5}$/.test(attributes[key] ?? '') && Number(attributes[key]) > 0 ? [[key, attributes[key]]] : []));
				return { tagName: 'img', attribs: { ...(src ? { src } : {}), alt: attributes.alt ?? '', loading: 'lazy', ...dimensions } };
			}
		},
		exclusiveFilter: frame => frame.tag === 'img' && !frame.attribs.src
	});
}

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
/** Small fallback for stored Lexical content when the CMS has not emitted HTML. */
function lexical(node: unknown, depth = 0): string {
	if (!node || typeof node !== 'object' || depth > 32) return '';
	const value = node as Record<string, unknown>;
	const children = Array.isArray(value.children) ? value.children.map(child => lexical(child, depth + 1)).join('') : '';
	if (value.type === 'text') {
		let text = escape(value.text);
		const format = typeof value.format === 'number' ? value.format : 0;
		for (const [bit, tag] of [[1, 'strong'], [2, 'em'], [4, 's'], [8, 'u'], [16, 'code'], [32, 'sub'], [64, 'sup']] as const) if (format & bit) text = `<${tag}>${text}</${tag}>`;
		return text;
	}
	if (value.type === 'linebreak') return '<br>';
	if (value.type === 'upload') {
		const media = value.value as Parameters<typeof imageURL>[0];
		const url = media && typeof media === 'object' && imageURL(media) ? media.url : null;
		return url ? `<img src="${escape(url)}" alt="${escape(typeof media === 'object' && media ? media.alt : '')}">` : '';
	}
	if (value.type === 'link' || value.type === 'autolink') {
		const fields = value.fields && typeof value.fields === 'object' ? value.fields as Record<string, unknown> : value;
		return `<a href="${escape(fields.url)}"${fields.newTab ? ' target="_blank"' : ''}>${children}</a>`;
	}
	const tag = value.type === 'paragraph' ? 'p' : value.type === 'quote' ? 'blockquote' : value.type === 'heading' && ['h2', 'h3', 'h4'].includes(String(value.tag)) ? String(value.tag) : value.type === 'list' ? value.listType === 'number' ? 'ol' : 'ul' : value.type === 'listitem' ? 'li' : null;
	return tag ? `<${tag}>${children}</${tag}>` : children;
}
export function projectSafeHtml(project: Pick<Project, 'content_html' | 'content_output' | 'content'>): string {
	return sanitizeRichText(project.content_html || project.content_output || lexical(project.content?.root));
}
