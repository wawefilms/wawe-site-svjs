// THROWAWAY, read-only Payload REST adapter. No CMS mutations or credentials.
// Proxies have fixed CMS/R2 upstreams in vite.foundation.config.ts (dev only).
const API = '/__stacking-api/projects?limit=100&depth=2';
const SAMPLE_TIME = .6;
const asMedia = value => value && typeof value === 'object' ? value : null;
export function mediaURL(value) {
  const url = new URL(value, 'https://cms.wawefilms.com');
  if (url.origin !== 'https://media.wawefilms.com') throw new Error(`Unsupported media origin: ${url.origin}`);
  return `/__stacking-media${url.pathname}${url.search}`;
}
function release(video) { video.pause(); video.removeAttribute('src'); video.load(); }
function eventOnce(target, event, action, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const clean = () => { clearTimeout(timer); target.removeEventListener(event, success); target.removeEventListener('error', fail); };
    const success = () => { clean(); resolve(); };
    const fail = () => { clean(); reject(new Error(`Media ${event} failed: ${target.currentSrc || target.src}`)); };
    const timer = setTimeout(() => { clean(); reject(new Error(`Media ${event} timed out`)); }, timeout);
    target.addEventListener(event, success, { once: true }); target.addEventListener('error', fail, { once: true });
    try { action(); } catch (error) { clean(); reject(error); }
  });
}
async function loadVideo(url, onUpdate) {
  const video = document.createElement('video');
  video.muted = true; video.defaultMuted = true; video.playsInline = true; video.loop = true; video.preload = 'auto';
  try {
    await eventOnce(video, 'loadeddata', () => { video.src = url; video.load(); });
    if (!video.videoWidth || !video.videoHeight) throw new Error('No decoded video dimensions');
    const sample = Math.min(SAMPLE_TIME, Math.max(0, video.duration - .1));
    if (sample > 0) await eventOnce(video, 'seeked', () => { video.currentTime = sample; }, 15000);
    video.addEventListener('seeked', onUpdate);
    return video;
  } catch (error) { release(video); throw error; }
}
async function loadImage(url) {
  const image = new Image();
  await eventOnce(image, 'load', () => { image.src = url; }, 20000);
  await image.decode(); return image;
}
function still(video) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 960 / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}
function videoCandidates(project) {
  const base = asMedia(project.video), small = asMedia(base?.smallFile);
  const probe = document.createElement('video');
  return [small, base].filter((m, i, list) => m?.url && m.mimeType?.startsWith('video/') &&
    probe.canPlayType(m.mimeType) && list.findIndex(n => n?.url === m.url) === i)
    .sort((a, b) => Number(b.mimeType === 'video/webm') - Number(a.mimeType === 'video/webm'));
}
export async function loadMedia(onUpdate = () => {}) {
  const response = await fetch(API, { credentials: 'omit', signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`Payload projects: HTTP ${response.status}. Check cms.wawefilms.com.`);
  const data = await response.json();
  if (!Array.isArray(data.docs)) throw new Error('Payload did not return a project list');
  const docs = data.docs.sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity) ||
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const warnings = [], projects = [], allocated = [];
  async function loadProject(project) {
    let video = null, selected = null;
    for (const candidate of videoCandidates(project)) {
      try { video = await loadVideo(mediaURL(candidate.url), onUpdate); selected = candidate; break; }
      catch (error) { warnings.push(`${project.title.trim()}: ${error.message}`); }
    }
    if (!video) throw new Error(`${project.title.trim()}: no playable video`);
    allocated.push(video);
    let poster = null, posterUrl = null;
    const asset = asMedia(project.poster);
    // Some CMS poster relationships contain a VIDEO. Never feed those to Image.
    if (asset?.mimeType?.startsWith('image/') && asset.url) {
      try { poster = await loadImage(mediaURL(asset.url)); posterUrl = asset.url; }
      catch (error) { warnings.push(`${project.title.trim()}: poster unavailable; using decoded video frame`); }
    }
    if (!poster) poster = still(video);
    const width = video.videoWidth || selected.width, height = video.videoHeight || selected.height;
    return { id: project.id, title: project.title.trim(), slug: project.slug, ratio: width / height,
      poster, video, videoUrl: selected.url, posterUrl };
  }
  // At most three project downloads in flight. Stop at six usable projects; don't
  // preload the entire catalogue merely to fill this composition comparison.
  async function loadProjects() {
    for (let i = 0; i < docs.length && projects.length < 6;) {
      const batch = docs.slice(i, i + Math.min(3, 6 - projects.length)); i += batch.length;
      const results = await Promise.allSettled(batch.map(loadProject));
      results.forEach(result => {
        if (result.status === 'fulfilled') projects.push(result.value);
        else warnings.push(result.reason.message);
      });
    }
    if (projects.length < 6) throw new Error(`Only ${projects.length}/6 projects could load. ${warnings.at(-1) ?? 'Check the CMS media.'}`);
  }
  const results = await Promise.allSettled([
    loadProjects(), loadVideo('/showreel-mock.webm', onUpdate),
    loadImage(new URL('./assets/badge.png', import.meta.url).href)
  ]);
  const failed = results.find(result => result.status === 'rejected');
  if (failed) {
    allocated.forEach(release);
    if (results[1].status === 'fulfilled') release(results[1].value);
    throw failed.reason;
  }
  const hero = results[1].value, badge = results[2].value;
  const videos = [...projects.map(p => p.video), hero];
  return {
    projects, hero, badge, warnings,
    pause() { videos.forEach(v => v.pause()); },
    reset() { videos.forEach(v => { v.pause(); v.currentTime = Math.min(SAMPLE_TIME, Math.max(0, v.duration - .1)); }); },
    dispose() { videos.forEach(v => { v.removeEventListener('seeked', onUpdate); release(v); }); }
  };
}
