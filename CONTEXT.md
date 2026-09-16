# CONTEXT — Wawe Films

Ubiquitous language for the single-context repo. Use these terms verbatim; don't drift to synonyms.

## Glossary

| Term | Definition |
|---|---|
| **Project** | A film / video work shown on the site. Collection `projects`. Has `title`, `slug`, `video`, optional `poster`, optional `partMedia` / `carouselMedia`. |
| **Media** | Uploaded file in `media` collection. Stores `filename`, `url`, `width`/`height` (probed via ffprobe), optional `smallFile` (compressed variant). Backed by R2 when env present, else local. |
| **Video Asset** | A source video file on disk (e.g. `.mp4`, `.mov`, `.mkv`) before conversion. Input to the converter. |
| **Conversion Output** | The two web-ready derivatives produced per Video Asset: `.webm` (VP9 via `libvpx-vp9`, CRF 33, 160k opus) and `_h265.mp4` (HEVC via `libx265`, CRF 26, 160k aac, `hvc1` tag). Both capped at longest side `MAX_SIZE` (1920) via `scale` filter + `yuv420p`. Written into `<inputFolder>_conv/`. |
| **Poster Image** | A single-frame still extracted from a Video Asset for use as `Project.poster`. Webp-only (`<base>-poster.webp`) via `libwebp` or `cwebp`; no jpg fallback. Subject to `POSTER_MAX_KB` size cap (default 500 KB); encoder re-renders at lower quality / smaller width until under limit. |
| **Scrubber / Frame Picker** | The UI used to choose the poster timestamp. v2 is primarily a **local Web UI** spawned by the shell script (python3 http server on random port, opened in default browser) with a `<video>` element + seek slider + Capture button. Python is optional: without it the script falls back to a **terminal prompt** (`Enter time or Enter for middle frame`) when TTY is present; otherwise auto middle-frame. ` --poster-time` / ` --auto-poster` force non-interactive. |
| **Size Estimate** | Pre-conversion readout per Video Asset: duration, dimensions, input size, and heuristic output estimate shown before encoding starts. Poster size enforced after extraction. |
| **Source Hash** | SHA-256 of a Video Asset's bytes, stored as `.sha256` sidecar in the `_conv` folder. Used to decide skip: outputs are skipped only when they already exist *and* the sidecar hash matches the current source (exact-file check, not filename-only). |
| **Upload** | Optional ` --upload` path that POSTs Conversion Outputs (and Poster Image) to Payload's `/api/media` using `PAYLOAD_URL` + `PAYLOAD_API_KEY`. Disabled by default; creates `Media` rows only — project assembly is manual in the admin. |

## Out of scope terms

- `SmallFile` is a field on `Media`, not a separate concept — it's where the `.webm` variant is linked.
- `Showreel` is a global, unrelated to per-project conversion.
