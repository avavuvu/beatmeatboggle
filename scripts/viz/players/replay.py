import argparse
import json
import math
import subprocess
import sys
import tempfile
import tomllib
import wave
from bisect import bisect_right
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Rectangle
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent.parent))
import style
from style import DATA

HERE = Path(__file__).parent
CONFIG = tomllib.loads((HERE / "replay.toml").read_text())
OUT = style.GRAPHS / "behaviour"
ASSETS = HERE.parent / "assets"
SOUNDS = HERE / CONFIG["sounds"]["dir"]

parser = argparse.ArgumentParser()
parser.add_argument("date", nargs="?", default="2026-10-02")
parser.add_argument("who", nargs="?", default="top", choices=["top", "median"])
parser.add_argument("--dark", action="store_true")
parser.add_argument("--silent", action="store_true")
parser.add_argument("--preview", action="store_true")
parser.add_argument("--words", type=int)
parser.add_argument("--frame", type=float)
args = parser.parse_args()

style.apply()
VIDEO, TIMING, LAYOUT, BOARD, AUDIO = (CONFIG[k] for k in ("video", "timing", "layout", "board", "audio"))
C = CONFIG["colours"]
T = C["dark" if args.dark else "light"]
HEAT = LinearSegmentedColormap.from_list("heat", [T["board"], C["heat_to"]])
RARE_BELOW = CONFIG["words"]["rare_below"]
FPS = VIDEO["fps"]

plt.rcParams.update({"figure.facecolor": T["surface"], "axes.facecolor": T["surface"], "savefig.facecolor": T["surface"], "text.color": T["foreground"]})

game = json.loads((DATA / f"replay_{args.date}.json").read_text())[args.who]
rates = json.loads((DATA / "play_word_rates.json").read_text())[args.date]
letters, size = game["letters"], game["size"]
words, paths, scores = game["words"][: args.words], game["paths"][: args.words], game["scores"][: args.words]
seed = game["seedWord"]
BONUSES = CONFIG["bonuses"]
POPUPS = CONFIG["popups"]

def points(i: int) -> int:
    return sum(s["points"] for s in scores[i])


def bonuses(i: int):
    return [(s["points"], BONUSES[s["reason"]]) for s in scores[i] if s["reason"] in BONUSES]


def popups(i: int):
    found = bonuses(i)
    if found:
        top = max(b["priority"] for _, b in found)
        found = [(pts, b) for pts, b in found if b["priority"] == top]
    out = [(f"+{pts}  {b['label']}", T["muted"] if b["colour"] == "muted" else b["colour"]) for pts, b in found]
    w = words[i]
    if w == seed:
        out.append((POPUPS["seed_label"], C["seed"]))
    elif is_rare(w):
        out.append((POPUPS["rare_label"].format(pct=f"{rates.get(w, 0) * 100:.0f}"), C["rare"]))
    return out

def is_rare(w: str) -> bool:
    return rates.get(w, 0) < RARE_BELOW

def word_colour(w: str) -> str:
    return C["seed"] if w == seed else C["rare"] if is_rare(w) else T["foreground"]

usage_before = [np.zeros(len(letters))]
for p in paths:
    nxt = usage_before[-1].copy()
    for tile in p or []:
        nxt[tile] += 1
    usage_before.append(nxt)
HEAT_MAX = max(usage_before[-1].max(), 1)

def tap_duration(k: int, n: int) -> float:
    return TIMING["tap_first"] + TIMING["tap_extra"] * (k / max(n - 1, 1)) ** TIMING["tap_curve"]

def hold_duration(i: int) -> float:
    return TIMING["hold_base"] + TIMING["hold_per_point"] * points(i)

segments = []
events = []
accepted = []
t = 0.0
events.append((t, "start", 0))
t += TIMING["start_delay"]
for i, w in enumerate(words):
    path = paths[i] or []
    n = len(path)
    for k in range(n):
        d = tap_duration(k, n)
        segments.append((t, t + d, i, "trace", k + 1))
        events.append((t, "tap", k))
        t += d
    events.append((t, "seed" if w == seed else "rare" if is_rare(w) else "submit", 0))
    accepted.append(t)
    for _, b in bonuses(i):
        if b["sound"]:
            events.append((t + 0.12, b["sound"], 0))
    h = hold_duration(i)
    segments.append((t, t + h, i, "hold", n))
    t += h
    segments.append((t, t + TIMING["fade"], i, "fade", n))
    t += TIMING["fade"]
events.append((t, "end", 0))
segments.append((t, t + TIMING["end_hold"], len(words) - 1, "end", 0))
t += TIMING["end_hold"]
TOTAL = t
starts = [s[0] for s in segments]
n_frames = int(math.ceil(TOTAL * FPS))

SCALE = 3 if args.preview else 1
DPI = 180 // SCALE
W, H = VIDEO["width"] / 180, VIDEO["height"] / 180
fig = plt.figure(figsize=(W, H), dpi=DPI)
margin = LAYOUT["margin"]
logo_px = int(LAYOUT["logo_width"] * VIDEO["width"] * 2 / SCALE)
logo_img = Image.open(ASSETS / T["logo"])
logo = np.asarray(logo_img.resize((logo_px, int(logo_px * logo_img.height / logo_img.width)), Image.LANCZOS)) / 255
logo_w = LAYOUT["logo_width"]
logo_h = logo_w * (logo.shape[0] / logo.shape[1]) * W / H
logo_ax = fig.add_axes(((1 - logo_w) / 2, 1 - margin / 2 - logo_h, logo_w, logo_h))
logo_ax.imshow(logo)
board_w = 1 - 2 * margin
board_h = board_w * W / H
board_top = 1 - margin / 2 - logo_h - LAYOUT["logo_gap"]
board_ax = fig.add_axes((margin, board_top - board_h, board_w, board_h))
list_ax = fig.add_axes((margin, margin / 2, board_w, board_top - board_h - margin / 2))
for ax in (logo_ax, board_ax, list_ax):
    ax.axis("off")
board_ax.set_xlim(0, size)
board_ax.set_ylim(0, size)
board_ax.set_aspect("equal")
list_ax.set_xlim(0, 1)
list_ax.set_ylim(0, 1)

letter_size = BOARD[f"letter_size_{size}"]
tiles, labels = [], []
for i, letter in enumerate(letters):
    r, c = divmod(i, size)
    y = size - 1 - r
    rect = Rectangle((c, y), 1, 1, facecolor=T["board"], edgecolor=T["surface"], linewidth=BOARD["grout"], joinstyle="miter")
    board_ax.add_patch(rect)
    tiles.append(rect)
    is_q = letter == "q"
    labels.append(board_ax.text(c + (0.46 if is_q else 0.5), y + BOARD["letter_baseline"], "Qu" if is_q else letter.upper(), ha="center", va="baseline", fontsize=letter_size * (0.85 if is_q else 1), color=T["letter"], family="Sono", zorder=3))

(chain_line,) = board_ax.plot([], [], color=T["line"], linewidth=BOARD["line_width"], solid_capstyle="round", solid_joinstyle="round", zorder=5)
(chain_dot,) = board_ax.plot([], [], "o", color=T["line"], markersize=BOARD["dot_size"], zorder=6)

current = list_ax.text(0.5, 0.98, "", ha="center", va="top", fontsize=LAYOUT["word_size"], fontweight="bold")
score_text = list_ax.text(0.5, 0.78, "", ha="center", va="top", fontsize=LAYOUT["score_size"], color=T["muted"])
popup_text = [list_ax.text(0.5, 0.85, "", ha="center", va="top", fontsize=POPUPS["size"], fontweight="bold") for _ in range(3)]
COLS, ROWS = LAYOUT["list_cols"], LAYOUT["list_rows"]
row_y = [0.70 - k * (0.68 / ROWS) for k in range(ROWS)]
col_x = [0.08 + c * (0.92 / COLS) for c in range(COLS)]
rows_text = [[list_ax.text(col_x[c], y, "", ha="left", va="top", fontsize=LAYOUT["list_size"]) for c in range(COLS)] for y in row_y]

FADE_STEPS = 4
POP_STEPS = POPUPS["steps"]


def active_popup(now: float):
    j = bisect_right(accepted, now) - 1
    if j < 0 or now >= accepted[j] + POPUPS["duration"] or not popups(j):
        return None
    return j, min(int((now - accepted[j]) / POPUPS["duration"] * POP_STEPS), POP_STEPS - 1)


def state(frame: int):
    now = frame / FPS
    k = max(0, bisect_right(starts, now) - 1)
    start, end, i, phase, step = segments[k]
    sub = min(int((now - start) / (end - start) * FADE_STEPS), FADE_STEPS - 1) if phase == "fade" else 0
    return k, sub, active_popup(now)


def draw(frame: int):
    k, sub, pop = state(frame)
    _, _, i, phase, step = segments[k]
    word, path = words[i], paths[i] or []
    usage = usage_before[len(words) if phase == "end" else i].copy()
    if phase == "fade":
        for p in path:
            usage[p] += (sub + 1) / FADE_STEPS

    if phase == "end":
        chain_line.set_data([], [])
        chain_dot.set_data([], [])
        current.set_text("")
    else:
        xs = [p % size + 0.5 for p in path[:step]]
        ys = [size - 1 - p // size + 0.5 for p in path[:step]]
        chain_line.set_data(xs, ys)
        chain_dot.set_data(xs[-1:], ys[-1:])
        current.set_text("".join("qu" if letters[p] == "q" else letters[p] for p in path[:step]).upper())
        current.set_color(word_colour(word) if phase != "trace" else T["foreground"])

    for t_, rect in enumerate(tiles):
        rect.set_facecolor(HEAT(usage[t_] / HEAT_MAX))

    shown = popups(pop[0]) if pop else []
    progress = (pop[1] + 0.5) / POP_STEPS if pop else 0
    for slot, label_artist in enumerate(popup_text):
        if slot < len(shown):
            label, colour = shown[slot]
            x = 0.5 if len(shown) == 1 else 0.28 + 0.44 * slot if len(shown) == 2 else 0.17 + 0.33 * slot
            label_artist.set_text(label)
            label_artist.set_color(colour)
            label_artist.set_position((x, 0.85 + POPUPS["rise"] * progress))
            fade_from = POPUPS["fade_from"]
            label_artist.set_alpha(1.0 if progress < fade_from else max(0.0, 1 - (progress - fade_from) / (1 - fade_from)))
        else:
            label_artist.set_text("")

    done = i + (1 if phase in ("hold", "fade", "end") else 0)
    found = words[:done]
    score_text.set_text(f"{len(found)} words    {sum(points(j) for j in range(done))} points")
    visible = ROWS * COLS
    start = max(0, done - visible)
    for k in range(visible):
        j = start + k
        cell = rows_text[k % ROWS][k // ROWS]
        if j < done:
            w = found[j]
            cell.set_text(f"{j + 1:>2}  {w}")
            cell.set_color(word_colour(w))
            cell.set_fontweight("bold" if w == seed or is_rare(w) else "normal")
        else:
            cell.set_text("")
    return tiles

RATE = AUDIO["rate"]

def synth(slot: str) -> np.ndarray:
    def tone(freqs, seconds, decay=8.0, amp=0.5):
        tt = np.arange(int(RATE * seconds)) / RATE
        env = np.exp(-decay * tt)
        return sum(np.sin(2 * np.pi * f * tt) * env for f in freqs) / len(freqs) * amp

    if slot == "tap":
        return tone([660], 0.09, decay=40, amp=0.6)
    if slot == "submit":
        return np.concatenate([tone([523], 0.08, 25), tone([784], 0.22, 12)])
    if slot == "rare":
        return np.concatenate([tone([784], 0.06, 30), tone([988], 0.06, 30), tone([1319], 0.06, 30), tone([1568, 2093], 0.5, 6, 0.6)])
    if slot == "seed":
        return tone([392, 494, 587, 784], 0.9, decay=3, amp=0.7)
    if slot == "dirty":
        return np.concatenate([tone([233, 311], 0.12, 20, 0.6), tone([196, 262, 330], 0.5, 5, 0.6)])
    if slot == "start":
        return tone([330, 440], 0.4, decay=6, amp=0.4)
    if slot == "end":
        return tone([392, 311, 261], 1.2, decay=2.5, amp=0.5)
    return np.zeros(1)

def load_sound(slot: str) -> np.ndarray:
    src = SOUNDS / CONFIG["sounds"][slot]
    if not src.exists():
        return synth(slot).astype(np.float32)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-ac", "1", "-ar", str(RATE), "-f", "wav", tmp.name], check=True)
        with wave.open(tmp.name) as w:
            raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    return raw.astype(np.float32) / 32768

def pitch(sample: np.ndarray, semitones: float) -> np.ndarray:
    idx = np.arange(0, len(sample), 2 ** (semitones / 12))
    return np.interp(idx, np.arange(len(sample)), sample).astype(np.float32)


def degree_to_semitones(degree: int) -> int:
    scale = AUDIO["tap_scale"]
    degree = min(degree, AUDIO["tap_max_degrees"])
    return 12 * (degree // len(scale)) + scale[degree % len(scale)]

def render_audio(path: Path):
    bank = {slot: load_sound(slot) for slot in ("start", "tap", "submit", "rare", "seed", "dirty", "end")}
    mix = np.zeros(int(TOTAL * RATE) + RATE, dtype=np.float32)
    for when, slot, step in events:
        s = pitch(bank["tap"], degree_to_semitones(step)) if slot == "tap" else bank[slot]
        at = int(when * RATE)
        mix[at : at + len(s)] += s[: len(mix) - at]
    mix = np.clip(mix / (np.abs(mix).max() or 1) * 0.9, -1, 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())

suffix = f"{'_dark' if args.dark else ''}{'_preview' if args.preview else ''}"
out = OUT / f"replay_{args.date}_{args.who}{suffix}.mp4"

if args.frame is not None:
    draw(int(args.frame * FPS))
    png = OUT / f"replay_{args.date}_{args.who}{suffix}_{args.frame:g}s.png"
    fig.savefig(png, dpi=DPI)
    print("wrote", png)
    sys.exit()

fps = 15 if args.preview else FPS
step_frames = FPS // fps
fig.canvas.draw()
height, width = np.asarray(fig.canvas.buffer_rgba()).shape[:2]
encode = ["-c:v", "libx264", "-crf", "30" if args.preview else str(VIDEO["crf"]), "-preset", "ultrafast" if args.preview else VIDEO["preset"], "-pix_fmt", "yuv420p"]

with tempfile.TemporaryDirectory() as tmp:
    silent = Path(tmp) / "video.mp4"
    proc = subprocess.Popen(
        ["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{width}x{height}", "-r", str(fps), "-i", "-", "-an", *encode, str(silent)],
        stdin=subprocess.PIPE,
    )
    last = None
    buf = b""
    rendered = 0
    for frame in range(0, n_frames, step_frames):
        key = state(frame)
        if key != last:
            draw(frame)
            fig.canvas.draw()
            buf = bytes(fig.canvas.buffer_rgba())
            last = key
            rendered += 1
        proc.stdin.write(buf)
    proc.stdin.close()
    proc.wait()
    if args.silent or args.preview:
        silent.replace(out)
    else:
        audio = Path(tmp) / "audio.wav"
        render_audio(audio)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(silent), "-i", str(audio), "-c:v", "copy", "-c:a", "aac", "-b:a", AUDIO["bitrate"], "-shortest", str(out)], check=True)
print("wrote", out, f"({TOTAL:.0f}s, {width}x{height}, {rendered} frames rendered of {n_frames // step_frames}, {sum(1 for w in words if is_rare(w))} rare words)")
