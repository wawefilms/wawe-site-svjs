#!/usr/bin/env bash
# re-exec under bash if invoked via zsh (curl | zsh)
if [ -n "${ZSH_VERSION:-}" ]; then
  if command -v bash >/dev/null 2>&1; then exec bash "$0" "$@"; else echo "zsh detected but bash not found — install bash (brew install bash) and run with bash" >&2; exit 1; fi
fi
# ═══════════════════════════════════════════════════════════════════════
#  video-convertor.sh — wawe edition
#
#  Turns every video in a folder into TWO web-ready files (in a new
#  "<name>_conv" subfolder — your originals are NEVER touched):
#
#    •  .webm  (VP9)  — smallest, best quality          → Chrome, Edge,
#                                                        Firefox, Android
#    •  _h265.mp4 (HEVC) — fallback                     → Apple / iPhone /
#                                                        iPad / Safari
#  plus per-video poster image .webp picked via a
#  local Web UI scrubber (or auto middle-frame). Posters are webp-only
#  and capped at POSTER_MAX_KB.
#
#  Install / run in one command (curl-pipe):
#    curl -fsSL https://wawefilms.com/scripts/video-convertor.sh | bash -s -- /path/to/folder
#    # optional: interactive poster picker + upload
#    curl -fsSL https://wawefilms.com/scripts/video-convertor.sh | bash -s -- --upload /path/to/folder
#
#  Or download then run:
#    curl -fsSLO https://wawefilms.com/scripts/video-convertor.sh
#    chmod +x video-convertor.sh
#    ./video-convertor.sh /path/to/folder
#    ./video-convertor.sh            # drag-and-drop prompt
#    ./video-convertor.sh --help
#
#  Requires: ffmpeg + ffprobe with webp support (ffmpeg built with libwebp,
#            or cwebp from `brew install webp`). Python3 is optional — only
#            needed for the browser scrubber UI. Without it you get a
#            terminal prompt (or --auto-poster for middle frame).
# ═══════════════════════════════════════════════════════════════════════

# ── tune these if you like ──────────────────────────────────────────────
VP9_CRF=33      # WebM quality (lower = better/bigger)
H265_CRF=26     # HEVC quality
MAX_SIZE=1920   # cap longest side (1920 = 1080p, 3840 = keep 4K)
POSTER_MAX_KB=500   # poster image must not exceed this (KB)
POSTER_WIDTH_FALLBACKS="1920 1280 960"  # tried when poster over limit
# How many encodes at once (defaults to CPU cores)
CONCURRENCY=${CONCURRENCY:-$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 4)}
# ────────────────────────────────────────────────────────────────────────

set -u
CONV_SUFFIX="_conv"
AUDIO_BITRATE="160k"
VERSION="2.0.0-wawe"

# ── shell compat ────────────────────────────────────────────────────
# Works on macOS stock bash 3.2 (/bin/bash) and bash 4+. No `mapfile`,
# no `wait -n` — portable fallbacks are used below.
HAVE_WAIT_N=0
if [ "${BASH_VERSINFO[0]:-0}" -ge 4 ]; then HAVE_WAIT_N=1; fi

# ── defaults for flags ─────────────────────────────────────────────────
FLAG_UPLOAD=0
FLAG_AUTO_POSTER=0
FLAG_SKIP_POSTER=0
FLAG_POSTER_TIME=""
FLAG_POSTER_MAX_KB=""
FLAG_DRY_RUN=0
POSITIONAL=""

usage() {
  cat <<'USAGE'
Usage: video-convertor.sh [options] [folder]

Converts every video in a folder to .webm (VP9) + _h265.mp4 (HEVC) in
<folder>_conv/. Also extracts a poster image per video via a browser
scrubber (or auto middle-frame).

Options:
  --upload              Upload outputs to Payload /api/media after conversion.
                        Needs env: PAYLOAD_URL and PAYLOAD_API_KEY (or --payload-url/--payload-key).
                        Off by default — project assembly is manual.
  --payload-url URL     Override PAYLOAD_URL env.
  --payload-key KEY     Override PAYLOAD_API_KEY env.
  --auto-poster         Skip Web UI, auto-pick middle frame for poster.
  --skip-poster         Don't create poster images at all.
  --poster-time SEC     Use fixed timestamp (seconds) for all posters, e.g. 1.5
  --poster-max-kb KB    Override poster size cap (default 500).
  --concurrency N       Override parallel encodes (default: CPU cores).
  --dry-run             Show size estimates and what would be done, then exit.
  -h, --help            Show this help.

Folder:
  Pass as argument, or omit to get a drag-and-drop prompt.

curl | bash:
  curl -fsSL https://wawefilms.com/scripts/video-convertor.sh | bash -s -- [options] [folder]

Poster picker (webp-only, capped at POSTER_MAX_KB):
  By default if a TTY + python3 are available, a local Web UI opens in
  your browser to scrub each video and Capture the poster frame.
  Without python3 you get a terminal prompt per video (time or Enter for middle).
  Falls back to middle frame when headless or --auto-poster.
  Requires ffmpeg with libwebp or cwebp (brew install webp); no jpg fallback.
USAGE
}

PAYLOAD_URL_CLI=""
PAYLOAD_KEY_CLI=""
while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --upload) FLAG_UPLOAD=1; shift ;;
    --payload-url) PAYLOAD_URL_CLI="${2:-}"; shift 2 ;;
    --payload-key) PAYLOAD_KEY_CLI="${2:-}"; shift 2 ;;
    --auto-poster) FLAG_AUTO_POSTER=1; shift ;;
    --skip-poster) FLAG_SKIP_POSTER=1; shift ;;
    --poster-time) FLAG_POSTER_TIME="${2:-}"; shift 2 ;;
    --poster-max-kb) FLAG_POSTER_MAX_KB="${2:-}"; shift 2 ;;
    --concurrency) CONCURRENCY="${2:-}"; shift 2 ;;
    --dry-run) FLAG_DRY_RUN=1; shift ;;
    --) shift; if [ $# -gt 0 ]; then POSITIONAL="$1"; shift; fi; break ;;
    -*) printf '\033[1;31mUnknown option: %s\033[0m\n' "$1" >&2; usage >&2; exit 1 ;;
    *) if [ -z "$POSITIONAL" ]; then POSITIONAL="$1"; else printf '\033[1;31mOnly one folder supported: %s\033[0m\n' "$1" >&2; exit 1; fi; shift ;;
  esac
done
if [ -n "${FLAG_POSTER_MAX_KB}" ]; then POSTER_MAX_KB="$FLAG_POSTER_MAX_KB"; fi

# payload env resolution
PAYLOAD_URL="${PAYLOAD_URL_CLI:-${PAYLOAD_URL:-}}"
PAYLOAD_API_KEY="${PAYLOAD_KEY_CLI:-${PAYLOAD_API_KEY:-}}"

# ── printing helpers ────────────────────────────────────────────────────
info(){ printf '\033[1;36m%s\033[0m\n' "$*"; }
ok(){   printf '\033[1;32m%s\033[0m\n' "$*"; }
warn(){ printf '\033[1;33m%s\033[0m\n' "$*"; }
err(){  printf '\033[1;31m%s\033[0m\n' "$*"; }
dim(){  printf '\033[2m%s\033[0m\n' "$*"; }
# Interactive even when stdin is a pipe (curl | bash): stdin is the
# script, but /dev/tty is still the user's terminal.
has_tty() { [ -t 0 ] || [ -t 1 ] || [ -t 2 ] || [ -r /dev/tty ]; }
# Read one line into $1 from the terminal (works piped or not).
# Usage: tty_read VAR; returns non-zero on EOF.
tty_read() {
  local _var=$1 _line
  if [ -t 0 ]; then
    IFS= read -r "$_var" || return 1
  else
    IFS= read -r "$_var" </dev/tty || return 1
  fi
  return 0
}

# ── check ffmpeg/ffprobe exists ─────────────────────────────────────────
if ! command -v ffmpeg >/dev/null 2>&1; then
  err "ffmpeg is not installed."
  err "  macOS:  brew install ffmpeg"
  err "  Linux:  sudo apt install ffmpeg"
  exit 1
fi
if ! command -v ffprobe >/dev/null 2>&1; then
  err "ffprobe is not installed (comes with ffmpeg)."
  exit 1
fi

missing=""
for enc in libvpx-vp9 libx265 libopus; do
  ffmpeg -hide_banner -encoders 2>/dev/null | grep -q " $enc " || missing="$missing $enc"
done
if [ -n "$missing" ]; then
  err "This ffmpeg is missing:$missing"
  err "Install the full build with:   brew install ffmpeg"
  exit 1
fi

# -- webp-only: require ffmpeg libwebp or cwebp; fail fast with helpful message
HAS_WEBP_ENCODER=0
if ffmpeg -hide_banner -encoders 2>/dev/null | grep -qE " webp | libwebp "; then HAS_WEBP_ENCODER=1; fi
if [ "$HAS_WEBP_ENCODER" -eq 1 ]; then
  if ! ffmpeg -hide_banner -h encoder=webp 2>&1 | grep -q "Encoder webp"; then
    if ! ffmpeg -hide_banner -h encoder=libwebp 2>&1 | grep -q "Encoder libwebp"; then
      HAS_WEBP_ENCODER=0
    fi
  fi
fi
HAS_CWEBP=0; command -v cwebp >/dev/null 2>&1 && HAS_CWEBP=1
if [ "$HAS_WEBP_ENCODER" -eq 0 ] && [ "$HAS_CWEBP" -eq 0 ]; then
  _need_webp_msg="Poster is webp-only but this ffmpeg cannot encode webp and cwebp is missing."
  _need_webp_hint="Fix: brew install webp  (provides cwebp)  — or: brew reinstall ffmpeg --with-webp"
  # don't exit here for --help/--skip-poster; check later when poster is actually needed
  NEED_WEBP_WARNING="$_need_webp_msg $_need_webp_hint"
else
  NEED_WEBP_WARNING=""
fi

# ── helpers ─────────────────────────────────────────────────────────────
clean_drop_path() {
  local p=$1
  case "$p" in
    \"*\") p=${p#\"}; p=${p%\"} ;;
    \'*\') p=${p#\'}; p=${p%\'} ;;
  esac
  p=$(printf '%s' "$p" | sed -e 's/\\\(.\)/\1/g' -e 's#/$##')
  printf '%s' "$p"
}

file_hash() {
  local f=$1
  if command -v shasum >/dev/null 2>&1; then shasum -a 256 -- "$f" | awk '{print $1}'
  elif command -v sha256sum >/dev/null 2>&1; then sha256sum -- "$f" | awk '{print $1}'
  else cksum -- "$f" | awk '{print $1}' # last resort
  fi
}

human_kb() { awk -v b="$1" 'BEGIN{ if(b>=1048576) printf "%.1f MB", b/1048576; else if(b>=1024) printf "%.0f KB", b/1024; else printf "%d B", b }'; }
human_mb() { awk -v b="$1" 'BEGIN{printf "%.1f MB", b/1024}'; }
fmt_time() { awk -v s="$1" 'BEGIN{ h=int(s/3600); m=int((s%3600)/60); sec=s%60; if(h>0) printf "%d:%02d:%05.2f",h,m,sec; else printf "%d:%05.2f",m,sec }'; }

# poster extraction: extract_poster <src> <out_base_without_ext> <time_sec> <max_kb>
# webp-only. Prints final path or errors. Requires HAS_WEBP_ENCODER or HAS_CWEBP.
extract_poster() {
  local src=$1 base=$2 t=$3 maxkb=$4
  local out="${base}.webp" sz=0

  if [ "$HAS_WEBP_ENCODER" -eq 0 ] && [ "$HAS_CWEBP" -eq 0 ]; then
    err "$NEED_WEBP_WARNING"
    return 1
  fi

  if [ "$HAS_WEBP_ENCODER" -eq 1 ]; then
    for q in 85 75 65 50 40; do
      for w in $POSTER_WIDTH_FALLBACKS; do
        local sc="scale='if(gt(iw,ih),min(${w},iw),-2)':'if(gt(iw,ih),-2,min(${w},ih))',format=yuv420p"
        if ffmpeg -nostdin -hide_banner -loglevel error -y -ss "$t" -i "$src" -vframes 1 -vf "$sc" -c:v libwebp -quality "$q" "$out" 2>/dev/null; then
          sz=$(wc -c < "$out" 2>/dev/null | tr -d ' '); sz=$(( (sz+1023)/1024 ))
          if [ "$sz" -le "$maxkb" ]; then printf '%s' "$out"; return 0; fi
        else
          # try generic webp encoder name if libwebp failed
          if ffmpeg -nostdin -hide_banner -loglevel error -y -ss "$t" -i "$src" -vframes 1 -vf "$sc" -c:v webp -quality "$q" "$out" 2>/dev/null; then
            sz=$(wc -c < "$out" 2>/dev/null | tr -d ' '); sz=$(( (sz+1023)/1024 ))
            if [ "$sz" -le "$maxkb" ]; then printf '%s' "$out"; return 0; fi
          fi
        fi
        [ "$w" = "1920" ] && break
      done
    done
    if [ -f "$out" ]; then printf '%s' "$out"; return 0; fi
  fi
  if [ "$HAS_CWEBP" -eq 1 ]; then
    local tmp_png
    tmp_png=$(mktemp /tmp/poster_XXXX.png)
    for q in 85 75 65 50; do
      for w in $POSTER_WIDTH_FALLBACKS; do
        local sc="scale='if(gt(iw,ih),min(${w},iw),-2)':'if(gt(iw,ih),-2,min(${w},ih))',format=yuv420p"
        if ffmpeg -nostdin -hide_banner -loglevel error -y -ss "$t" -i "$src" -vframes 1 -vf "$sc" "$tmp_png" 2>/dev/null; then
          if cwebp -q "$q" "$tmp_png" -o "$out" >/dev/null 2>&1; then
            sz=$(wc -c < "$out" 2>/dev/null | tr -d ' '); sz=$(( (sz+1023)/1024 ))
            if [ "$sz" -le "$maxkb" ]; then rm -f "$tmp_png"; printf '%s' "$out"; return 0; fi
          fi
        fi
        [ "$w" = "1920" ] && break
      done
    done
    rm -f "$tmp_png"
    if [ -f "$out" ]; then printf '%s' "$out"; return 0; fi
  fi
  err "Failed to create webp poster for $src (t=$t). Try: brew install webp"
  return 1
}

# ── pick the folder ─────────────────────────────────────────────────────
SRC=""
if [ -n "${POSITIONAL:-}" ]; then
  SRC=$(clean_drop_path "$POSITIONAL")
  if [ ! -d "$SRC" ]; then
    err "That folder wasn't found: $SRC"
    exit 1
  fi
else
  # No folder arg: prompt on the terminal even when stdin is piped (curl | bash).
  if ! has_tty; then
    err "No folder argument given and no terminal found (curl | bash without args, non-interactive)."
    err "Usage: curl -fsSL https://vc-atm.pages.dev/video-convertor.sh | bash -s -- /path/to/folder"
    exit 1
  fi
  printf '\n\033[1;35m══════════ VIDEOS — convert folder (wawe v%s) ══════════\033[0m\n\n' "$VERSION"
  printf 'Converts every video in one folder to:\n'
  printf '   \033[1m.webm\033[0m  (VP9)     smallest, great quality\n'
  printf '   \033[1m_h265.mp4\033[0m (HEVC)  fallback for iPhone/iPad/Safari\n'
  printf '   \033[1mposter.webp\033[0m  poster frame (webp-only, scrubber or auto)\n\n'
  printf 'Output goes in a new "\033[1m<name>_conv\033[0m" subfolder.\n'
  printf 'Originals are left untouched.\n\n'
  until [ -n "$SRC" ]; do
    printf '\033[1mDrag the folder here, then press Enter:\033[0m '
    if ! tty_read reply; then echo; err 'Input closed — exiting.'; exit 1; fi
    reply=$(clean_drop_path "$reply")
    if [ -z "$reply" ]; then err 'No folder entered. Try again, or press Ctrl+C to quit.'
    elif [ ! -d "$reply" ]; then err "That folder wasn't found: $reply"; err '(External disk? Make sure it is mounted.)'
    else SRC=$reply
    fi
  done
fi

VIDEO_EXTS='mp4 mov m4v webm mkv avi mpg mpeg 3gp'
FILES=()
while IFS= read -r _vf; do
  [ -n "$_vf" ] && FILES=("${FILES[@]}" "$_vf")
done < <(
  for ext in $VIDEO_EXTS; do
    find "$SRC" -maxdepth 1 -type f -iname "*.$ext" 2>/dev/null
  done | sort -u
)

if [ "${#FILES[@]}" -eq 0 ]; then
  err "No videos found in: $SRC"
  exit 1
fi

DIR=$(basename "$SRC")
OUT="$SRC/${DIR}${CONV_SUFFIX}"
mkdir -p "$OUT"

scale_filter="scale='if(gt(iw,ih),min(${MAX_SIZE},iw),-2)':'if(gt(iw,ih),-2,min(${MAX_SIZE},ih))',format=yuv420p"

info ""
info "Found ${#FILES[@]} video(s) in:  $SRC"
info "Writing to:                     $OUT"
if [ -n "$NEED_WEBP_WARNING" ]; then
  if [ "$FLAG_SKIP_POSTER" -eq 0 ]; then
    warn "$NEED_WEBP_WARNING"
  fi
fi
info ""

# ── size estimates (pre-conversion) ─────────────────────────────────────
info "── size estimates (before conversion) ──────────────────────────"
printf '\033[2m%-30s %8s  %9s  %10s  est. webm/h265\033[0m\n' "file" "duration" "dims" "input"
for f in "${FILES[@]}"; do
  base=$(basename "${f%.*}")
  # probe
  dims=$(ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$f" 2>/dev/null | head -1)
  [ -z "$dims" ] && dims="?"
  dur=$(ffprobe -v quiet -show_entries format=duration -of default=nw=1:nk=1 "$f" 2>/dev/null | head -1)
  if [ -n "$dur" ]; then dur_fmt=$(fmt_time "$dur"); else dur_fmt="?"; fi
  sz_bytes=$(wc -c < "$f" 2>/dev/null | tr -d ' '); sz_fmt=$(human_kb "$sz_bytes" 2>/dev/null || echo "?")
  # heuristic estimates
  est_webm=$(awk -v b="$sz_bytes" 'BEGIN{printf "%.0f KB", b*0.38/1024}')
  est_h265=$(awk -v b="$sz_bytes" 'BEGIN{printf "%.0f KB", b*0.55/1024}')
  printf '  %-30s %8s  %9s  %10s  ~ %s / %s\n' "$base" "$dur_fmt" "$dims" "$sz_fmt" "$est_webm" "$est_h265"
done
printf '\033[2m  (estimates are heuristic — actual depends on CRF/content; poster capped at %d KB)\033[0m\n' "$POSTER_MAX_KB"
echo ""

if [ "$FLAG_DRY_RUN" -eq 1 ]; then
  info "--dry-run: not converting. Poster would be: $([ "$FLAG_SKIP_POSTER" -eq 1 ] && echo "skipped" || echo "via $([ "$FLAG_AUTO_POSTER" -eq 1 ] || [ -n "$FLAG_POSTER_TIME" ] && echo "auto/fixed" || echo "Web UI")")"
  exit 0
fi

# ── poster phase ────────────────────────────────────────────────────────
# Decide poster mode
POSTER_MODE="webui"  # webui | prompt | auto | fixed | skip
if [ "$FLAG_SKIP_POSTER" -eq 1 ]; then POSTER_MODE="skip"
elif [ -n "$FLAG_POSTER_TIME" ]; then POSTER_MODE="fixed"
elif [ "$FLAG_AUTO_POSTER" -eq 1 ]; then POSTER_MODE="auto"
elif ! has_tty; then POSTER_MODE="auto"
elif ! command -v python3 >/dev/null 2>&1; then POSTER_MODE="prompt"
fi

# webp-only guard: poster modes need webp capability unless --skip-poster
if [ "$POSTER_MODE" != "skip" ] && [ -n "$NEED_WEBP_WARNING" ]; then
  err "$NEED_WEBP_WARNING"
  err "Posters are webp-only. Install webp support or pass --skip-poster to skip posters."
  exit 1
fi

# helper: get duration float via ffprobe
get_duration() { ffprobe -v quiet -show_entries format=duration -of default=nw=1:nk=1 "$1" 2>/dev/null | head -1; }

if [ "$POSTER_MODE" = "skip" ]; then
  info "Poster: skipped (--skip-poster)"
else
  # Build list of pending posters (skip if poster already exists and hash will be handled later? always prompt)
  # For Web UI we still show all files
  if [ "$POSTER_MODE" = "webui" ]; then
    info "── poster picker — opening browser scrubber ───────────────────"
    info "Pick a frame for each video in your browser, then click Capture."
    info "If the browser doesn't open, visit the URL printed below."
    echo ""
    # Prepare temp work dir for python server
    PY_TMPDIR=$(mktemp -d /tmp/wawe-poster-XXXX)
    trap 'rm -rf "$PY_TMPDIR" 2>/dev/null; trap - EXIT; exit' INT TERM
    # Build file list json and html
    # Use python to pick free port
    PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()' 2>/dev/null || echo 8765)
    # Write file manifest
    MANIFEST="$PY_TMPDIR/manifest.json"
    printf '[\n' > "$MANIFEST"
    first=1
    for idx in "${!FILES[@]}"; do
      f="${FILES[$idx]}"
      b=$(basename "${f%.*}")
      dur=$(get_duration "$f"); [ -z "$dur" ] && dur=10
      # json escape base
      esc_base=$(printf '%s' "$b" | sed 's/"/\\"/g')
      esc_path=$(printf '%s' "$f" | sed 's/"/\\"/g')
      if [ $first -eq 1 ]; then first=0; else printf ',\n' >> "$MANIFEST"; fi
      printf '  {"idx":%d,"base":"%s","path":"%s","duration":%s}' "$idx" "$esc_base" "$esc_path" "$dur" >> "$MANIFEST"
    done
    printf '\n]\n' >> "$MANIFEST"

    # Write python server
    cat > "$PY_TMPDIR/server.py" <<'PYEOF'
import json, os, sys, subprocess, urllib.parse, mimetypes, shlex
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

MANIFEST = Path(sys.argv[1])
OUT_DIR = Path(sys.argv[2])
SRC_DIR = Path(sys.argv[3]) if len(sys.argv) > 3 else Path(".")
PORT = int(sys.argv[4]) if len(sys.argv) > 4 else 8765
SCALE = sys.argv[5] if len(sys.argv) > 5 else "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))',format=yuv420p"
POSTER_MAX_KB = int(sys.argv[6]) if len(sys.argv) > 6 else 500

manifest = json.loads(MANIFEST.read_text())
by_idx = {m["idx"]: m for m in manifest}

# detect webp capability
def has_webp():
    try:
        out = subprocess.run(["ffmpeg","-hide_banner","-encoders"], capture_output=True, text=True, timeout=5)
        return " webp " in out.stdout or " libwebp " in out.stdout
    except: return False
HAS_WEBP = has_webp()
try:
    import shutil
    HAS_CWEBP = shutil.which("cwebp") is not None
except: HAS_CWEBP = False

HTML = r"""<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wawe — poster picker</title>
<style>
*{box-sizing:border-box} body{font-family:ui-sans,system-ui,sans-serif;background:#0a0a0a;color:#eee;margin:0;padding:24px}
h1{font-size:18px;margin:0 0 6px} .sub{color:#888;font-size:13px;margin-bottom:18px}
.card{background:#151515;border:1px solid #222;border-radius:12px;padding:16px;margin-bottom:16px}
.row{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
video{width:640px;max-width:100%;height:auto;background:#000;border-radius:8px;max-height:360px}
.controls{flex:1;min-width:260px}
.slider{width:100%} .time{display:flex;gap:8px;align-items:center;margin:8px 0}
.time input{width:110px;background:#222;color:#eee;border:1px solid #333;border-radius:6px;padding:6px 8px}
.btn{appearance:none;border:0;border-radius:8px;padding:10px 14px;font-weight:600;cursor:pointer}
.btn-cap{background:#fff;color:#000} .btn-cap:disabled{opacity:.5}
.btn-done{background:#333;color:#fff;margin-top:16px}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;background:#222;color:#aaa;margin-left:8px}
.badge.done{background:#1a3a1a;color:#7f7}
.meta{font-size:12px;color:#888;margin-top:8px}
.tip{font-size:12px;color:#666;margin-top:12px}
</style>
<h1>Wawe — pick a poster frame per video</h1>
<div class=sub>Scrub each video, then <b>Capture poster</b>. Re-capture to replace. When all are done, click <b>Done — start converting</b>.</div>
<div id=app></div>
<button id=done class="btn btn-done">Done — start converting</button>
<div class=tip>Keyboard: ←/→ ±1s, Shift+←/→ ±5s. Time also accepts 12.34 or 0:12.34</div>
<script>
const FILES = __FILES_JSON__;
const app = document.getElementById('app');
let done = new Set();
function fmt(s){ s=Number(s)||0; const m=Math.floor(s/60), sec=s%60; return m+':'+String(sec.toFixed(2)).padStart(5,'0'); }
FILES.forEach(f=>{
  const card=document.createElement('div'); card.className='card'; card.id='card-'+f.idx;
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center"><strong>${f.base}</strong><span class=badge id=badge-${f.idx}>pending</span></div>
    <div class=row style="margin-top:12px">
      <video id=vid-${f.idx} controls preload="metadata" playsinline src="/video/${f.idx}"></video>
      <div class=controls>
        <input class=slider type=range id=slider-${f.idx} min=0 max="${f.duration}" step="0.05" value="0">
        <div class=time><input id=time-${f.idx} value="0.00"><span id=fmt-${f.idx} style="color:#888;font-size:13px">0:00.00 / ${fmt(f.duration)}</span></div>
        <button class="btn btn-cap" id=cap-${f.idx}>Capture poster</button>
        <div class=meta id=meta-${f.idx}></div>
      </div>
    </div>`;
  app.appendChild(card);
  const vid=document.getElementById('vid-'+f.idx);
  const slider=document.getElementById('slider-'+f.idx);
  const tIn=document.getElementById('time-'+f.idx);
  const fmtEl=document.getElementById('fmt-'+f.idx);
  const cap=document.getElementById('cap-'+f.idx);
  const meta=document.getElementById('meta-'+f.idx);
  const badge=document.getElementById('badge-'+f.idx);
  function syncFromVideo(){ slider.value=vid.currentTime; tIn.value=vid.currentTime.toFixed(2); fmtEl.textContent=fmt(vid.currentTime)+' / '+fmt(f.duration); }
  vid.addEventListener('timeupdate', syncFromVideo);
  vid.addEventListener('loadedmetadata', ()=>{ slider.max=vid.duration||f.duration; syncFromVideo(); });
  slider.addEventListener('input', ()=>{ vid.currentTime=parseFloat(slider.value); tIn.value=parseFloat(slider.value).toFixed(2); fmtEl.textContent=fmt(slider.value)+' / '+fmt(f.duration); });
  tIn.addEventListener('change', ()=>{
    let v=tIn.value.trim(); if(v.includes(':')){ const p=v.split(':'); v=parseFloat(p[0])*60+parseFloat(p[1]); } else v=parseFloat(v);
    if(isFinite(v)){ vid.currentTime=Math.max(0,Math.min(v, vid.duration||f.duration)); }
  });
  // keyboard scrub
  card.addEventListener('keydown', (e)=>{
    if(e.target.tagName==='INPUT') return;
    if(e.key==='ArrowLeft' || e.key==='ArrowRight'){
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      vid.currentTime = Math.max(0, Math.min(vid.currentTime + (e.key==='ArrowLeft'? -step : step), vid.duration||f.duration));
    }
  });
  card.tabIndex=0;
  cap.addEventListener('click', async ()=>{
    cap.disabled=true; cap.textContent='Capturing…'; meta.textContent='';
    try{
      const r=await fetch('/api/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idx:f.idx,time: vid.currentTime})});
      const j=await r.json();
      if(!r.ok || !j.ok) throw new Error(j.error||'capture failed');
      meta.innerHTML = `Saved <code>${j.file}</code> — ${j.sizeKB} KB${j.overLimit? ' <span style="color:#e55">(over '+j.limitKB+' KB, auto-compressed)</span>':''} — <a href="${j.url}" target="_blank" style="color:#8cf">view</a> <img src="${j.url}?t=${Date.now()}" style="display:block;margin-top:8px;max-width:320px;border-radius:6px;border:1px solid #222">`;
      badge.textContent='captured'; badge.classList.add('done'); done.add(f.idx);
    }catch(e){ meta.textContent='Error: '+e.message; meta.style.color='#e55'; }
    cap.disabled=false; cap.textContent='Capture poster';
  });
});
document.getElementById('done').addEventListener('click', async ()=>{
  await fetch('/api/done',{method:'POST'});
  document.body.innerHTML='<div style="padding:40px;text-align:center"><h2>Posters saved — you can close this tab.</h2><p style="color:#888">Return to your terminal; conversion will continue.</p></div>';
});
</script>
"""

class H(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): sys.stderr.write(fmt % args + "\n")
    def do_GET(self):
        p = urllib.parse.urlparse(self.path)
        if p.path == "/" or p.path == "/index.html":
            html = HTML.replace("__FILES_JSON__", json.dumps(manifest))
            body = html.encode()
            self.send_response(200); self.send_header("Content-Type","text/html; charset=utf-8"); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body); return
        if p.path.startswith("/video/"):
            try:
                idx = int(p.path.split("/")[2].split("?")[0]); m = by_idx[idx]
                fpath = Path(m["path"])
                if not fpath.exists(): self.send_error(404, "video not found"); return
                fsize = fpath.stat().st_size
                ctype = mimetypes.guess_type(str(fpath))[0] or "video/mp4"
                # Range support
                rng = self.headers.get("Range")
                if rng:
                    try:
                        # bytes=START-END
                        part = rng.split("=")[1].split("-"); start = int(part[0]) if part[0] else 0; end = int(part[1]) if part[1] else fsize-1
                        end = min(end, fsize-1)
                        length = end-start+1
                        self.send_response(206); self.send_header("Content-Type", ctype); self.send_header("Accept-Ranges","bytes")
                        self.send_header("Content-Range", f"bytes {start}-{end}/{fsize}"); self.send_header("Content-Length", str(length)); self.end_headers()
                        with open(fpath,"rb") as fh: fh.seek(start); self.wfile.write(fh.read(length))
                        return
                    except: pass
                self.send_response(200); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(fsize)); self.send_header("Accept-Ranges","bytes"); self.end_headers()
                with open(fpath,"rb") as fh:
                    while True:
                        chunk=fh.read(1024*256)
                        if not chunk: break
                        self.wfile.write(chunk)
                return
            except Exception as e:
                self.send_error(500, str(e)); return
        if p.path.startswith("/poster/"):
            try:
                idx = int(p.path.split("/")[2].split("?")[0]); m = by_idx[idx]
                base = m["base"]
                # find poster file
                for ext in (".webp",):
                    cand = OUT_DIR / f"{base}-poster{ext}"
                    if cand.exists():
                        ctype = mimetypes.guess_type(str(cand))[0] or "image/jpeg"
                        data = cand.read_bytes()
                        self.send_response(200); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data); return
                self.send_error(404, "poster not found"); return
            except Exception as e: self.send_error(500, str(e)); return
        self.send_error(404)

    def do_POST(self):
        p = urllib.parse.urlparse(self.path)
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else b""
        if p.path == "/api/capture":
            try:
                j = json.loads(body.decode() or "{}")
                idx = int(j["idx"]); t = float(j["time"])
                m = by_idx[idx]; src = m["path"]; base = m["base"]
                # clamp t
                dur = float(m.get("duration") or 10)
                t = max(0, min(t, max(0, dur-0.1)))
                # extract poster with size cap loop
                import tempfile, shutil
                tmpdir = Path(tempfile.gettempdir())
                # strategy: try webp -> cwebp -> jpg
                out_path = None
                # helper to run ffmpeg
                def run_ffmpeg(out, vf, extra):
                    cmd = ["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-ss", str(t), "-i", src, "-vframes","1","-vf", vf] + extra + [out]
                    return subprocess.run(cmd, capture_output=True, timeout=30)

                widths = [1920,1280,960]
                # attempt webp via ffmpeg
                if HAS_WEBP:
                    for q in (85,75,65,50):
                        for w in widths:
                            vf = f"scale='if(gt(iw,ih),min({w},iw),-2)':'if(gt(iw,ih),-2,min({w},ih))',format=yuv420p"
                            cand = OUT_DIR / f"{base}-poster.webp"
                            # try libwebp then webp
                            for codec in (["-c:v","libwebp","-quality", str(q)], ["-c:v","webp","-quality", str(q)]):
                                r = run_ffmpeg(str(cand), vf, codec)
                                if r.returncode==0 and cand.exists():
                                    sz = cand.stat().st_size
                                    if sz <= POSTER_MAX_KB*1024: out_path=cand; break
                            if out_path: break
                            if w==1920: break
                        if out_path: break
                    if out_path is None and (OUT_DIR / f"{base}-poster.webp").exists():
                        out_path = OUT_DIR / f"{base}-poster.webp"
                if out_path is None and HAS_CWEBP:
                    for q in (85,75,65,50):
                        for w in widths:
                            vf = f"scale='if(gt(iw,ih),min({w},iw),-2)':'if(gt(iw,ih),-2,min({w},ih))',format=yuv420p"
                            tmp_png = tmpdir / f"wawe_poster_{idx}.png"
                            r = run_ffmpeg(str(tmp_png), vf, [])
                            if r.returncode==0 and tmp_png.exists():
                                cand = OUT_DIR / f"{base}-poster.webp"
                                cr = subprocess.run(["cwebp","-q", str(q), str(tmp_png), "-o", str(cand)], capture_output=True, timeout=20)
                                if cr.returncode==0 and cand.exists():
                                    sz = cand.stat().st_size
                                    if sz <= POSTER_MAX_KB*1024: out_path=cand; tmp_png.unlink(missing_ok=True); break
                            if w==1920: break
                        if out_path: break
                    if out_path is None and (OUT_DIR / f"{base}-poster.webp").exists():
                        out_path = OUT_DIR / f"{base}-poster.webp"
                # webp-only: no jpg fallback
                if out_path is None or not out_path.exists():
                    self.send_response(500); self.send_header("Content-Type","application/json"); self.end_headers()
                    self.wfile.write(json.dumps({"ok":False,"error":"webp poster failed — need ffmpeg with libwebp or cwebp (brew install webp)"}).encode()); return
                sz = out_path.stat().st_size
                over = sz > POSTER_MAX_KB*1024
                resp = {"ok":True,"file": out_path.name, "sizeKB": round(sz/1024), "limitKB": POSTER_MAX_KB, "overLimit": over, "url": f"/poster/{idx}"}
                data = json.dumps(resp).encode()
                self.send_response(200); self.send_header("Content-Type","application/json"); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data); return
            except Exception as e:
                import traceback; traceback.print_exc()
                data = json.dumps({"ok":False,"error": str(e)}).encode()
                self.send_response(500); self.send_header("Content-Type","application/json"); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data); return
        if p.path == "/api/done":
            data = json.dumps({"ok":True}).encode()
            self.send_response(200); self.send_header("Content-Type","application/json"); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
            # signal done via file
            (OUT_DIR / ".wawe_poster_done").write_text("done")
            # shutdown after a moment in thread
            import threading
            def shutdown():
                import time; time.sleep(0.5)
                self.server.shutdown()
            threading.Thread(target=shutdown, daemon=True).start()
            return
        self.send_error(404)

try:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), H)
    print(f"Serving on http://127.0.0.1:{PORT}/", flush=True)
    server.serve_forever()
except Exception as e:
    print(f"Server error: {e}", file=sys.stderr); sys.exit(1)
PYEOF
    # launch server in background
    python3 "$PY_TMPDIR/server.py" "$MANIFEST" "$OUT" "$SRC" "$PORT" "$scale_filter" "$POSTER_MAX_KB" &
    SERVER_PID=$!
    # wait for server to be ready
    for i in $(seq 1 30); do
      if curl -fsS "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then break; fi
      sleep 0.2
    done
    URL="http://127.0.0.1:$PORT/"
    info "Poster scrubber: $URL"
    # open browser
    if command -v open >/dev/null 2>&1; then open "$URL" 2>/dev/null &
    elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" 2>/dev/null &
    elif [ -n "${BROWSER:-}" ]; then "$BROWSER" "$URL" 2>/dev/null &
    else warn "Please open $URL in your browser."
    fi
    info "Waiting for you to Capture posters and click Done in the browser… (Ctrl+C to skip to auto)"
    # trap Ctrl+C to kill server and fallback to auto
    trap 'kill $SERVER_PID 2>/dev/null; rm -rf "$PY_TMPDIR" 2>/dev/null; warn "Poster UI interrupted — falling back to auto middle-frame."; POSTER_MODE=auto; break' INT
    # wait until done file appears or server exits
    while kill -0 $SERVER_PID 2>/dev/null; do
      if [ -f "$OUT/.wawe_poster_done" ]; then break; fi
      sleep 0.5
    done
    # clean up server
    kill $SERVER_PID 2>/dev/null; wait $SERVER_PID 2>/dev/null || true
    rm -rf "$PY_TMPDIR" 2>/dev/null
    rm -f "$OUT/.wawe_poster_done"
    trap - INT
    # ensure every file has a poster; auto-fill missing with middle frame
    for f in "${FILES[@]}"; do
      base=$(basename "${f%.*}")
      if [ ! -f "$OUT/${base}-poster.webp" ]; then
        dur=$(get_duration "$f"); [ -z "$dur" ] && dur=10
        # use middle frame, clamp to dur-0.3
        mid=$(awk -v d="$dur" 'BEGIN{print d/2}')
        info "  auto poster for $base at $mid s (was not captured)"
        out_base="$OUT/${base}-poster"
        # we stored base without ext; pass OUT/base-poster
        poster=$(extract_poster "$f" "$OUT/${base}-poster" "$mid" "$POSTER_MAX_KB")
        sz=$(wc -c < "$poster" 2>/dev/null | tr -d ' '); szkb=$(( (sz+1023)/1024 ))
        if [ "$szkb" -gt "$POSTER_MAX_KB" ]; then warn "  poster $base still ${szkb}KB > ${POSTER_MAX_KB}KB (max-compressed)"; else ok "  poster $base → $(basename "$poster") ${szkb}KB"; fi
      else
        # already captured, report size
        poster="$OUT/${base}-poster.webp"
        sz=$(wc -c < "$poster" 2>/dev/null | tr -d ' '); szkb=$(( (sz+1023)/1024 ))
        ok "  poster $base → $(basename "$poster") ${szkb}KB"
      fi
    done
  elif [ "$POSTER_MODE" = "fixed" ]; then
    info "── poster: fixed time ${FLAG_POSTER_TIME}s ─────────────────────────"
    for f in "${FILES[@]}"; do
      base=$(basename "${f%.*}")
      out="$OUT/${base}-poster"
      poster=$(extract_poster "$f" "$out" "$FLAG_POSTER_TIME" "$POSTER_MAX_KB")
      sz=$(wc -c < "$poster" 2>/dev/null | tr -d ' '); szkb=$(( (sz+1023)/1024 ))
      ok "  $base → $(basename "$poster") ${szkb}KB @ ${FLAG_POSTER_TIME}s"
    done
  elif [ "$POSTER_MODE" = "prompt" ]; then
    info "── poster: terminal prompt (no python3) ─────────────────────────"
    info "Enter a timestamp per video (seconds or m:ss), or Enter for middle frame."
    for f in "${FILES[@]}"; do
      base=$(basename "${f%.*}")
      if [ -f "$OUT/${base}-poster.webp" ]; then
        sz=$(wc -c < "$OUT/${base}-poster.webp" 2>/dev/null | tr -d ' '); szkb=$(( (sz+1023)/1024 ))
        printf '  %s — poster exists (%s, %sKB). Overwrite? [y/N] ' "$base" "$(fmt_time "$(get_duration "$f")")" "$szkb"
        tty_read _ans || _ans=""
        case "$_ans" in y|Y) ;; *) dim "  $base keeping existing poster"; continue ;; esac
      fi
      dur=$(get_duration "$f"); [ -z "$dur" ] && dur=10
      mid=$(awk -v d="$dur" 'BEGIN{print d/2}')
      dur_fmt=$(fmt_time "$dur")
      while true; do
        printf '  %s  duration %s — poster time [%.2f]: ' "$base" "$dur_fmt" "$mid"
        if ! tty_read inp; then inp=""; fi
        inp=$(printf '%s' "$inp" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        if [ -z "$inp" ]; then inp="$mid"; fi
        # parse m:ss or s
        if printf '%s' "$inp" | grep -q ':'; then
          parsed=$(printf '%s' "$inp" | awk -F: '{ if(NF==2) print $1*60+$2; else if(NF==3) print $1*3600+$2*60+$3; else print $1 }')
          inp="$parsed"
        fi
        # validate numeric
        if ! printf '%s' "$inp" | grep -qE '^[0-9]+(\.[0-9]+)?$'; then warn "    not a number: $inp"; continue; fi
        # clamp
        inp=$(awk -v v="$inp" -v d="$dur" 'BEGIN{ if(v<0) v=0; if(v>d-0.05) v=d-0.05; if(v<0) v=0; printf "%.3f", v }')
        poster=$(extract_poster "$f" "$OUT/${base}-poster" "$inp" "$POSTER_MAX_KB") || { err "    poster failed"; continue; }
        sz=$(wc -c < "$poster" 2>/dev/null | tr -d ' '); szkb=$(( (sz+1023)/1024 ))
        ok "    → $(basename "$poster") ${szkb}KB @ ${inp}s (limit ${POSTER_MAX_KB}KB)"
        break
      done
    done
  elif [ "$POSTER_MODE" = "auto" ]; then
    info "── poster: auto (middle frame) ─────────────────────────────────"
    for f in "${FILES[@]}"; do
      base=$(basename "${f%.*}")
      # if poster already exists skip? still need hash? we generate if missing
      if [ -f "$OUT/${base}-poster.webp" ]; then
        poster="$OUT/${base}-poster.webp"
        # check hash later; still generate if missing
        continue
      fi
      dur=$(get_duration "$f"); [ -z "$dur" ] && dur=10
      mid=$(awk -v d="$dur" 'BEGIN{print d/2}')
      mid=$(awk -v d="$dur" -v m="$mid" 'BEGIN{if(m<0.2) m=0.2; if(m>d-0.2) m=d-0.2; if(m<0) m=0; print m}')
      poster=$(extract_poster "$f" "$OUT/${base}-poster" "$mid" "$POSTER_MAX_KB")
      sz=$(wc -c < "$poster" 2>/dev/null | tr -d ' '); szkb=$(( (sz+1023)/1024 ))
      ok "  $base → $(basename "$poster") ${szkb}KB @ ${mid}s"
    done
    # report existing
    for f in "${FILES[@]}"; do
      base=$(basename "${f%.*}")
      poster="$OUT/${base}-poster.webp"; [ -f "$poster" ] || poster=""
      if [ -n "$poster" ]; then
        sz=$(wc -c < "$poster" 2>/dev/null | tr -d ' '); szkb=$(( (sz+1023)/1024 ))
        dim "  $base poster exists: $(basename "$poster") ${szkb}KB"
      fi
    done
  fi
  echo ""
fi

# ── parallel worker pool ────────────────────────────────────────────────
pids=0
skip_files=0
launch() {  # launch <ffmpeg args...>  → background + enforce the cap
  "$@" &
  pids=$((pids + 1))
  if [ "$pids" -ge "$CONCURRENCY" ]; then
    if [ "$HAVE_WAIT_N" -eq 1 ]; then
      wait -n 2>/dev/null || wait
    else
      wait  # bash 3.2 has no wait -n: drain batch then continue
    fi
    pids=$((pids - 1))
    if [ "$HAVE_WAIT_N" -eq 0 ]; then pids=0; fi
  fi
}

info "── converting ──────────────────────────────────────────────────"
for f in "${FILES[@]}"; do
  stem="${f%.*}"
  base=$(basename "$stem")
  out_webm="$OUT/$base.webm"
  out_h265="$OUT/${base}_h265.mp4"
  out_poster="$OUT/${base}-poster.webp"
  hash_file="$OUT/.${base}.sha256"
  cur_hash=$(file_hash "$f")

  # hash-based skip: both outputs + poster (unless skipped) must exist and hash matches
  need_poster=1; [ "$POSTER_MODE" = "skip" ] && need_poster=0
  has_poster=0; [ -f "$out_poster" ] && has_poster=1
  if [ -f "$out_webm" ] && [ -f "$out_h265" ] && { [ "$need_poster" -eq 0 ] || [ "$has_poster" -eq 1 ]; } && [ -f "$hash_file" ]; then
    prev_hash=$(cat "$hash_file" 2>/dev/null | tr -d ' \n')
    if [ "$cur_hash" = "$prev_hash" ]; then
      skip_files=$((skip_files + 1))
      warn "skip (exact match): $base"
      continue
    else
      dim "re-encoding $base (source changed)"
    fi
  fi

  info "▶ $base  (both formats)"
  # ensure poster exists if not skipped and not already made (auto fallback)
  if [ "$need_poster" -eq 1 ] && [ "$has_poster" -eq 0 ]; then
    # poster was supposed to be made but wasn't (webui auto-fill already tried); make middle-frame now
    dur=$(get_duration "$f"); [ -z "$dur" ] && dur=10
    mid=$(awk -v d="$dur" 'BEGIN{print d/2}')
    poster=$(extract_poster "$f" "$OUT/${base}-poster" "$mid" "$POSTER_MAX_KB" 2>/dev/null)
    if [ -n "$poster" ] && [ -f "$poster" ]; then
      sz=$(wc -c < "$poster" 2>/dev/null | tr -d ' '); szkb=$(( (sz+1023)/1024 ))
      ok "  poster $base → $(basename "$poster") ${szkb}KB"
    fi
  fi

  launch ffmpeg -nostdin -hide_banner -loglevel error -y -i "$f" \
    -vf "$scale_filter" \
    -c:v libvpx-vp9 -crf "$VP9_CRF" -b:v 0 -row-mt 1 -cpu-used 3 -deadline good \
    -c:a libopus -b:a "$AUDIO_BITRATE" \
    "$out_webm"

  launch ffmpeg -nostdin -hide_banner -loglevel error -y -i "$f" \
    -vf "$scale_filter" \
    -c:v libx265 -crf "$H265_CRF" -preset medium -tag:v hvc1 \
    -c:a aac -b:a "$AUDIO_BITRATE" -movflags +faststart \
    "$out_h265"
done
wait

# write hashes for newly converted files
for f in "${FILES[@]}"; do
  base=$(basename "${f%.*}")
  out_webm="$OUT/$base.webm"; out_h265="$OUT/${base}_h265.mp4"
  if [ -f "$out_webm" ] && [ -f "$out_h265" ]; then
    file_hash "$f" > "$OUT/.${base}.sha256" 2>/dev/null || true
  fi
done

echo ""
info "══════════ done ══════════"
webm_count=$(find "$OUT" -maxdepth 1 -name '*.webm' 2>/dev/null | wc -l | tr -d ' ')
mp4_count=$(find "$OUT" -maxdepth 1 -name '*_h265.mp4' 2>/dev/null | wc -l | tr -d ' ')
poster_count=$(find "$OUT" -maxdepth 1 -name '*-poster.*' 2>/dev/null | wc -l | tr -d ' ')
after_kb=$(du -sk "$OUT" 2>/dev/null | awk '{print $1}')
ok "$webm_count video(s) converted  ($webm_count .webm + $mp4_count _h265.mp4 + $poster_count poster(s))"
if [ "$skip_files" -gt 0 ]; then info "$skip_files already done — skipped (hash match)."; fi
info "New files total:  $(human_mb "$after_kb")"
info "Output folder: $OUT"
echo ""

# ── upload (opt-in) ─────────────────────────────────────────────────────
if [ "$FLAG_UPLOAD" -eq 1 ]; then
  if [ -z "$PAYLOAD_URL" ] || [ -z "$PAYLOAD_API_KEY" ]; then
    warn "Upload requested but PAYLOAD_URL or PAYLOAD_API_KEY is not set."
    warn "  Set env:  PAYLOAD_URL=https://your-payload.com PAYLOAD_API_KEY=... $0 --upload ..."
    warn "  Or:       $0 --payload-url URL --payload-key KEY --upload ..."
    warn "Skipping upload."
  else
    info "── uploading to $PAYLOAD_URL ────────────────────────────────"
    for f in "${FILES[@]}"; do
      base=$(basename "${f%.*}")
      for kind in webm h265 poster; do
        case $kind in
          webm) fp="$OUT/$base.webm" ;;
          h265) fp="$OUT/${base}_h265.mp4" ;;
          poster) fp="$OUT/${base}-poster.webp"; [ -f "$fp" ] || continue ;;
        esac
        [ -f "$fp" ] || continue
        info "  upload $kind: $(basename "$fp")"
        # Payload REST: POST /api/media with multipart/form-data, header Authorization: users API key
        # API key auth uses header 'Authorization: Bearer <key>' or 'x-api-key'
        resp=$(curl -s -w "\n%{http_code}" -X POST "$PAYLOAD_URL/api/media" \
          -H "Authorization: Bearer $PAYLOAD_API_KEY" \
          -F "file=@$fp" \
          -F "alt=$base $kind" 2>&1)
        code=$(printf '%s' "$resp" | tail -1)
        body=$(printf '%s' "$resp" | sed '$d')
        if [ "$code" -ge 200 ] && [ "$code" -lt 300 ]; then
          ok "    ✓ $kind uploaded (HTTP $code)"
        else
          err "    ✗ $kind failed (HTTP $code): $body"
        fi
      done
    done
  fi
fi

# offer to open the output folder (macOS) — only if interactive
if has_tty && command -v open >/dev/null 2>&1; then
  printf 'Open the output folder now? [Y/n] '
  tty_read ans || ans=""
  case "$ans" in ""|y|Y) open "$OUT" 2>/dev/null || true ;; esac
fi
