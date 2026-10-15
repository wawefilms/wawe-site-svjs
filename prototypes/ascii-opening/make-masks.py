"""Prototype-only asset preparation. Run with Python + Pillow; no runtime dependency.
Keep enclosed transparent components > 1000px: the artwork's letters/counters,
not its distressed flecks. No replacement typography or hand-traced shapes.
"""
from pathlib import Path
from collections import deque
from PIL import Image

root = Path(__file__).parent
im = Image.open(root / 'logo-source.png').convert('RGBA')
w, h = im.size
alpha = im.getchannel('A')
a = alpha.tobytes()
seen = bytearray(w * h)
mask = bytearray(w * h)
for start in range(w * h):
    if seen[start] or a[start] >= 128:
        continue
    queue = deque([start])
    seen[start] = 1
    component = []
    border = False
    while queue:
        p = queue.popleft()
        component.append(p)
        x, y = p % w, p // w
        border |= x == 0 or x == w - 1 or y == 0 or y == h - 1
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= nx < w and 0 <= ny < h:
                q = ny*w+nx
                if not seen[q] and a[q] < 128:
                    seen[q] = 1
                    queue.append(q)
    if not border and len(component) > 1000:
        for p in component:
            mask[p] = 255
letters = Image.frombytes('L', (w,h), bytes(mask))
letters.crop(letters.getbbox()).save(root / 'letters-mask.png')
alpha.crop(alpha.getbbox()).save(root / 'badge-mask.png')
