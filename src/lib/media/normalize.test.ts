import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizedMedia, imageURL, videoSources } from './normalize.ts';
import type { Media } from '../payload-types.ts';

const media = (values: Partial<Media>): Media => ({ id: 1, alt: 'Film', createdAt: '', updatedAt: '', ...values });
const video = media({ url: 'https://media.wawefilms.com/media/film.mov', mimeType: 'video/quicktime' });
const poster = media({ url: '/api/media/file/film.webp', mimeType: 'image/webp' });

test('unpopulated and missing media do not create broken sources', () => {
	for (const value of [null, undefined, 123]) {
		assert.equal(normalizedMedia(value).url, null);
		assert.deepEqual(videoSources(value), []);
	}
});
test('actual images are never video sources; video is never a poster', () => {
	assert.equal(normalizedMedia(poster).kind, 'image');
	assert.equal(normalizedMedia(poster).videoUrl, null);
	assert.equal(imageURL(video), null);
	assert.equal(normalizedMedia(video).kind, 'video');
	assert.equal(imageURL(media({ ...poster, mimeType: 'video/mp4' })), null);
	assert.deepEqual(videoSources(media({ ...poster, smallFile: video })), []);
});
test('safe smallFile video preferred, numeric/image smallFile falls back to original', () => {
	const small = media({ url: 'https://media.wawefilms.com/media/film.webm', mimeType: 'video/webm' });
	assert.equal(videoSources(media({ ...video, smallFile: small })).length, 2);
	assert.match(videoSources(media({ ...video, smallFile: small }))[0], /film.webm/);
	for (const smallFile of [123, poster]) assert.deepEqual(videoSources(media({ ...video, smallFile })), videoSources(video));
});
test('normalization preserves allowlists and rejects unsafe or contradictory sources', () => {
	for (const url of ['https://evil.test/media/film.mp4', 'https://media.wawefilms.com/media/film.mp4?redirect=x', 'https://media.wawefilms.com/media/%2e%2e.mp4']) {
		assert.equal(normalizedMedia(media({ url, mimeType: 'video/mp4' })).url, null);
	}
	assert.equal(normalizedMedia(media({ ...video, mimeType: 'image/png' })).url, null);
	assert.equal(normalizedMedia(media({ ...poster, width: -1, height: NaN })).width, null);
	assert.equal(normalizedMedia(media({ ...poster, width: -1, height: NaN })).height, null);
});
