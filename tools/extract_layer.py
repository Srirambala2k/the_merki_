"""Cut a foreground object out of a scene.

The mask is computed on the original-resolution pair, then upscaled and applied
to the 4K scene so the layer keeps the 4K pixels. Writes <layer_id>.png (RGBA,
cropped to the object's bounding box) and <layer_id>.json (bbox as fractions of
the full frame, used for placement).

Modes (per-layer options, see tools/layers.json):
  diff   subtract the clean background (default)
  circle diff, then fit a circle to the rim - for moons and planets
  bright light object on near-black space (astronaut)
  white  key out a plain white backdrop - for the UFO shot
  dark   dark specks on a lighter sky, by local contrast - for birds
Other options: hi, close (morphology), roi=[x0,y0,x1,y1] frame fractions that
limit where the object may be, keep (min blob size relative to the largest),
fill (set false for objects with a hole, such as a ring), maxluma (ignore pixels brighter than this).
"""
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

LO_SOFT, HI_SOFT = 30, 75  # soft-edge diff thresholds (0-255)
HULL_PX = 0.008  # soft-zone radius, fraction of image width
PAD = 0.01


def find(root: str, page: str, name: str) -> str:
    for d in os.listdir(root):
        if d.startswith(page):
            for dp, _, fs in os.walk(os.path.join(root, d)):
                if name in fs:
                    return os.path.join(dp, name)
    raise FileNotFoundError(f"{page}/{name}")


def smoothstep(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def match_grade(bg: np.ndarray, sc: np.ndarray) -> np.ndarray:
    """Fit a per-channel cubic bg->scene tone curve (robust to the object) and apply it to bg."""
    out = np.empty_like(bg)
    idx = np.random.default_rng(0).choice(bg.shape[0] * bg.shape[1], 200_000, replace=False)
    for c in range(3):
        x, y = bg[..., c].ravel()[idx] / 255, sc[..., c].ravel()[idx] / 255
        keep = np.ones_like(x, bool)
        for _ in range(4):
            coef = np.polyfit(x[keep], y[keep], 3)
            res = np.abs(np.polyval(coef, x) - y)
            keep = res <= np.percentile(res, 85)
        out[..., c] = np.clip(np.polyval(coef, bg[..., c] / 255), 0, 1) * 255
    return out


def roi_mask(shape, roi):
    h, w = shape
    m = np.zeros(shape, bool)
    if roi is None:
        m[:] = True
    else:
        x0, y0, x1, y1 = roi
        m[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = True
    return m


def largest(core, h, w, keep, min_frac=0.00005):
    lab, n = ndi.label(core)
    if n == 0:
        raise RuntimeError("no object found")
    sizes = np.asarray(ndi.sum(core, lab, range(1, n + 1)))
    ok = [i + 1 for i, s in enumerate(sizes) if s >= max(keep * sizes.max(), min_frac * h * w)]
    return np.isin(lab, ok)


def fit_circle(core):
    """Kasa least-squares circle through the rim of `core`, ignoring points on the frame edge."""
    h, w = core.shape
    edge = core & ~ndi.binary_erosion(core)
    ys, xs = np.nonzero(edge)
    m = (xs > 1) & (xs < w - 2) & (ys > 1) & (ys < h - 2)
    xs, ys = xs[m].astype(float), ys[m].astype(float)
    A = np.c_[2 * xs, 2 * ys, np.ones_like(xs)]
    cx, cy, k = np.linalg.lstsq(A, xs**2 + ys**2, rcond=None)[0]
    r = np.sqrt(k + cx**2 + cy**2)
    yy, xx = np.mgrid[:h, :w]
    return np.hypot(xx - cx, yy - cy) <= r


def build_alpha(bg: Image.Image, scene: Image.Image, o: dict) -> np.ndarray:
    mode, hi, close, keep = o.get("mode", "diff"), o.get("hi", 60), o.get("close", 3), o.get("keep", 0.15)
    raw = np.asarray(scene, np.float32)
    b = ndi.gaussian_filter(raw, (1.2, 1.2, 0))
    h, w = b.shape[:2]
    inside = roi_mask((h, w), o.get("roi"))

    if mode == "white":
        diff = 255 - b.min(axis=2)
        hi = o.get("hi", 40)
    elif mode == "bright":  # light object on near-black space
        a = ndi.gaussian_filter(np.asarray(bg, np.float32), (1.2, 1.2, 0))
        changed = np.abs(match_grade(a, b) - b).max(axis=2) > o.get("bgdiff", 18)  # drop nebula present in both
        neutral = (b[..., 2] - b[..., 0]) < o.get("neutral", 99)  # suit is grey, space is blue-tinted
        diff = np.where(changed & neutral, b.max(axis=2), 0)
        hi = o.get("hi", 45)
    elif mode == "dark":
        lum = raw.mean(axis=2)
        diff = np.clip(ndi.gaussian_filter(lum, 12) - ndi.gaussian_filter(lum, 0.8), 0, 255)
        hi = o.get("hi", 28)
    else:
        a = ndi.gaussian_filter(np.asarray(bg, np.float32), (1.2, 1.2, 0))
        diff = np.abs(match_grade(a, b) - b).max(axis=2)
    diff = np.where(inside, diff, 0)
    if "maxluma" in o:  # drop anything brighter than the object itself (stray bits of cloud)
        diff = np.where(raw.mean(axis=2) > o["maxluma"], 0, diff)

    core = diff > hi
    core = ndi.binary_closing(core, iterations=close)
    if o.get("fill", True):  # a ring must keep its hole, so it can be switched off
        core = ndi.binary_fill_holes(core)
    core = largest(core, h, w, 0.0 if mode == "dark" else keep, o.get("min", 0.00005)) & inside
    if mode == "circle":
        core = fit_circle(core) & inside

    hull = ndi.binary_dilation(core, iterations=max(2, int(w * HULL_PX)))
    soft = smoothstep(diff, o.get("lo", LO_SOFT), o.get("hs", HI_SOFT)) * hull
    hard = ndi.gaussian_filter(core.astype(np.float32), 1.0)
    if mode == "circle":
        return np.clip(hard, 0, 1)
    if mode == "dark":
        return np.clip(soft, 0, 1)
    return np.clip(np.maximum(hard, soft), 0, 1)


def extract(clean_path: str | None, scene_path: str, scene4k_path: str, out: str, lid: str, opts: dict | None = None) -> None:
    opts = opts or {}
    sc = Image.open(scene_path).convert("RGB")
    bg = Image.open(clean_path).convert("RGB").resize(sc.size, Image.LANCZOS) if clean_path else sc
    alpha = build_alpha(bg, sc, opts)

    big = Image.open(scene4k_path).convert("RGB")
    W, H = big.size
    a4 = Image.fromarray((alpha * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    rgba = big.copy()
    rgba.putalpha(a4)

    bbox = a4.point(lambda v: 255 if v > 12 else 0).getbbox()
    px, py = int(W * PAD), int(H * PAD)
    box = (max(0, bbox[0] - px), max(0, bbox[1] - py), min(W, bbox[2] + px), min(H, bbox[3] + py))
    os.makedirs(out, exist_ok=True)
    rgba.crop(box).save(os.path.join(out, f"{lid}.png"))
    with open(os.path.join(out, f"{lid}.json"), "w") as f:
        json.dump({"x": box[0] / W, "y": box[1] / H, "w": (box[2] - box[0]) / W, "h": (box[3] - box[1]) / H}, f)
    print(lid, box, "coverage", round(float((alpha > 0.5).mean()), 4))
