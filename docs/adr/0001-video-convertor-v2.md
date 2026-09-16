# ADR 0001 — video-convertor.sh v2: web scrubber, poster, and distribution

Date: 2026-09-03
Status: Accepted

## Context

The original `convert-videos.sh` (PPRO/anushkatidgam) converts every Video Asset in a folder into two Conversion Outputs: `.webm` (VP9, CRF 33) and `_h265.mp4` (HEVC, CRF 26), capped at `MAX_SIZE=1920`, into a `<name>_conv` subfolder. It skips when both outputs exist (filename-only check), runs encodes in parallel up to `CONCURRENCY`, and is interactive via drag-and-drop.

Requirements for v2:

1. Preserve old behaviour verbatim (flags, filter, codecs, parallelism, folder layout).
2. For every video also produce a Poster Image (`.webp`) by picking a frame — with a scrubber UI.
3. Show size estimates before conversion and enforce a poster size cap (`POSTER_MAX_KB`).
4. Host as a single file runnable via `curl | bash` / `curl | zsh`.
5. Optional ` --upload` to Payload's Media collection, off by default, media-only (project assembly stays manual).
6. Skip only when source is byte-identical (Source Hash), not just same name.

The scrubber choice was grilled: pure-terminal scrubbers (chafa/viu/fzf preview, sixel/kitty graphics) were evaluated and rejected as the primary UI — they are terminal-dependent, low fidelity for poster framing, and increase bash complexity. A local Web UI gives a native `<video>` scrubber, pixel-accurate preview, and is universally usable.

## Decision

### 1. Preserve encoding params

Keep `VP9_CRF=33`, `H265_CRF=26`, `MAX_SIZE=1920`, `AUDIO_BITRATE=160k`, `scale='if(gt(iw,ih),min(...),-2)...'`, `format=yuv420p`, `libvpx-vp9 -b:v 0 -row-mt 1 -cpu-used 3 -deadline good` and `libx265 -preset medium -tag:v hvc1 -movflags +faststart`. New flags are additive with sane defaults and don't change defaults.

### 2. Scrubber = local Web UI spawned by the shell (python optional)

- The bash script embeds a Python 3 http server (no external deps) started via `python3 - <<'PY'` on a random free port (`127.0.0.1:0`) when python3 and a TTY are present.
- It serves one HTML page with a `<video>` per source file (served via Range-supporting handler from the input folder), a seek slider, timecode input, keyboard scrubbing (arrow keys), and a Capture button.
- On Capture, the server runs `ffmpeg -ss <time> -i <source> -vframes 1 -vf scale...` to extract the Poster Image (webp-only), checks `POSTER_MAX_KB`, and re-encodes at descending quality / downscaled width until under limit, then responds with the resulting file size and preview URL.
- The script opens the browser via `open` (macOS) / `xdg-open` (Linux) / `$BROWSER`.
- **Python is optional** (amended 2026-09-03): if `python3` is missing but a TTY is present, the script falls back to a **terminal prompt** per video (`Enter time (e.g. 2.4 or 0:02.4) or Enter for middle frame`). If no TTY, or `--auto-poster` / `--poster-time` is given, it falls back to non-interactive extraction (middle frame or explicit timestamp). This satisfies "can we not do it without python?" — yes, the scrubber degrades to a pure bash+ffmpeg prompt without requiring python.
- Rationale: `python3` is preinstalled on macOS 12+ and most Linuxes; no `chafa`/`fzf`/`viu` needed; preview is high-fidelity; implementation stays in shell + one embedded Python file. Tradeoff: requires a browser. Accepted because users already have one, and the prompt fallback covers python-free environments.

Alternatives considered:
- Terminal image preview (chafa/sixel) — rejected: inconsistent support, no smooth scrubbing.
- Electron/Tauri app — rejected: not `curl|bash` distributable as single file.
- Pure bash + `ffplay` scrubbing — rejected: no frame capture UI, poor UX.
- Static HTML file:// without server — considered for python-free, but server gives direct ffmpeg integration and accurate size feedback; prompt fallback is simpler and already python-free.
### 3. Poster Image format and size cap — webp-only

- Poster is **webp-only**, no jpg fallback (amended 2026-09-03). Encoder priority: `ffmpeg libwebp` (if `ffmpeg -encoders` reports `libwebp`/`webp`), else `ffmpeg → png → cwebp` (requires `cwebp` from `brew install webp`). If neither is available the script exits with an install hint: `brew install webp` or `brew reinstall ffmpeg`. This matches the project's "limit to webp" requirement and avoids mixed-format consumers needing `<picture>` fallbacks.
- Homebrew `ffmpeg 9.0.1` tested on this machine lacks `libwebp`; `cwebp` is present (`/opt/homebrew/bin/cwebp 1.6.0`) so the `cwebp` path is exercised by default.

### 4. Size estimates

Before encoding, per file: `ffprobe` duration + dimensions + input size → printed table with heuristic estimate ("webm ≈ 30-45% of source, h265 ≈ 45-65%") because exact size requires encoding. After encoding, actual sizes and total are printed. For poster, actual byte size vs. limit is printed after each capture attempt.

### 5. Distribution: single curl-pipe file

- Single `video-convertor.sh` hosted as static asset: `wawe-site-svjs/static/scripts/video-convertor.sh` (served at `https://wawefilms.com/scripts/video-convertor.sh`). One command: `curl -fsSL https://wawefilms.com/scripts/video-convertor.sh | bash -s -- /path/to/folder` (also `zsh` compatible; script re-execs to bash if invoked via `zsh`).
- For `curl|bash` folder arg is passed after `--`; interactive drag-and-drop still works when run as file.
- Self-contained: only depends on `ffmpeg`/`ffprobe` with webp support (`cwebp` fallback) + optional `python3` for browser scrubber. Without python3 you get a terminal prompt (no extra deps). No Node/Bun.

### 6. Upload

- Flag `--upload` (off by default). When set, after conversion the script `curl`s each Conversion Output + Poster Image to `POST ${PAYLOAD_URL}/api/media` with `Authorization: Bearer ${PAYLOAD_API_KEY}` (Payload API key). Media-only; no Project creation. Documented as requiring `PAYLOAD_URL` and `PAYLOAD_API_KEY` env vars.
- If auth missing, script warns and skips upload.

### 7. Hash-based skip

- For each source, compute `shasum -a 256` (macOS) / `sha256sum` (Linux) and compare to sidecar `$OUT/.<base>.sha256`. Skip only when both outputs exist, poster exists (unless --skip-poster), and hash matches. Otherwise re-encode. On success, update sidecar.

## Consequences

- Users need `ffmpeg` with webp support (`brew install webp` for `cwebp` fallback) + optional `python3` for browser scrubber. Without python3 the script still works via a terminal prompt (pure bash+ffmpeg) — so python is not required.
- Web UI requires a browser + loopback port; headless/CI falls back to auto poster. Prompt mode requires a TTY.
- Poster is always `.webp` — consumers don't need jpg fallback handling.
- Single-file distribution keeps install friction low; updates are just re-curling.
- Hash check adds a per-file SHA-256 (~100-300ms for typical film clips); negligible vs. encode time.

## References

- Source script: `PPRO/anushkatidgam/convert-videos.sh`
- Glossary: `CONTEXT.md`
