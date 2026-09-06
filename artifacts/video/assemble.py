#!/usr/bin/env python3
"""Assemble the VeinVision SIA pitch film: scenes, VO, score, subtitles."""

from __future__ import annotations

import json
import math
import os
import subprocess
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path("/workspace")
ART = ROOT / "artifacts"
IMG = ART / "imagine_images"
SCN = ART / "video" / "scenes"
WRK = ART / "video" / "work"
AUD = ART / "audio"
PUB = ROOT / "public" / "video"
FRAMES = ART / "video" / "frames"

FONT_SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_SANS_B = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
FONT_SERIF_I = "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"

W, H, FPS = 1280, 720, 24
PAPER = (246, 243, 236)
INK = (28, 27, 25)
VEIN = (31, 138, 98)
MUTED = (110, 106, 98)

for p in (WRK, SCN, PUB, AUD, FRAMES):
    p.mkdir(parents=True, exist_ok=True)


def run(cmd: list[str], **kw) -> None:
    print("+", " ".join(str(c) for c in cmd[:12]), "..." if len(cmd) > 12 else "")
    subprocess.run(cmd, check=True, **kw)


def ff(*args: str) -> None:
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args])


def load_timestamps() -> tuple[str, list[tuple[float, float]], float]:
    data = json.loads((AUD / "voiceover.timestamps.json").read_text())
    chars = "".join(data["graph_chars"])
    times = [(float(a), float(b)) for a, b in data["graph_times"]]
    return chars, times, float(data["duration"])


def find_span(chars: str, times: list[tuple[float, float]], needle: str) -> tuple[float, float]:
    idx = chars.find(needle)
    if idx < 0:
        raise ValueError(f"needle not found: {needle!r}")
    start = times[idx][0]
    end = times[idx + len(needle) - 1][1]
    return start, end


def decode_vo() -> tuple[int, np.ndarray]:
    wav_path = AUD / "vo.wav"
    ff("-i", str(AUD / "voiceover.mp3"), "-ac", "1", "-ar", "44100", "-sample_fmt", "s16", str(wav_path))
    with wave.open(str(wav_path), "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    return sr, data


def write_wav(path: Path, sr: int, data: np.ndarray) -> None:
    clipped = np.clip(data, -1.0, 1.0)
    pcm = (clipped * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def env_adsr(n: int, sr: int, a=0.04, d=0.12, s=0.7, r=0.35) -> np.ndarray:
    t = np.arange(n) / sr
    dur = n / sr
    att = np.clip(t / max(a, 1e-4), 0, 1)
    rel = np.clip((dur - t) / max(r, 1e-4), 0, 1)
    # simple attack * release, sustain implied
    return (att ** 0.6) * (rel ** 0.45)


def tone(freq: float, dur: float, sr: int, amp: float = 0.06, detune: float = 0.003) -> np.ndarray:
    n = int(dur * sr)
    t = np.arange(n) / sr
    sig = (
        0.55 * np.sin(2 * np.pi * freq * t)
        + 0.22 * np.sin(2 * np.pi * freq * (1 + detune) * t)
        + 0.12 * np.sin(2 * np.pi * freq * 2 * t)
        + 0.05 * np.sin(2 * np.pi * freq * 3 * t)
    )
    # gentle lowpass-ish by averaging a delayed copy
    delayed = np.concatenate([np.zeros(int(0.004 * sr)), sig[: n - int(0.004 * sr)]])
    sig = 0.72 * sig + 0.28 * delayed
    return sig * env_adsr(n, sr) * amp


def drone(freq: float, dur: float, sr: int, amp: float = 0.03) -> np.ndarray:
    n = int(dur * sr)
    t = np.arange(n) / sr
    trem = 0.85 + 0.15 * np.sin(2 * np.pi * 0.12 * t)
    sig = (
        0.7 * np.sin(2 * np.pi * freq * t)
        + 0.25 * np.sin(2 * np.pi * freq * 0.5 * t)
        + 0.12 * np.sin(2 * np.pi * freq * 1.5 * t)
    ) * trem
    fade = np.minimum(np.linspace(0, 1, n) / 0.08, 1.0)
    fade = np.minimum(fade, np.linspace(1, 0, n) / 0.12)
    fade = np.clip(fade, 0, 1)
    # smoother fades
    att = np.clip(t / 1.6, 0, 1)
    rel = np.clip((dur - t) / 2.4, 0, 1)
    return sig * att * rel * amp


def place(canvas: np.ndarray, clip: np.ndarray, t: float, sr: int) -> None:
    i = int(t * sr)
    j = i + len(clip)
    if i >= len(canvas):
        return
    if j > len(canvas):
        clip = clip[: len(canvas) - i]
        j = len(canvas)
    if i < 0:
        clip = clip[-i:]
        i = 0
    canvas[i:j] += clip


def make_score(sr: int, dur: float) -> np.ndarray:
    """Original restrained score: tense minor pad → warm major lift. No samples."""
    n = int(dur * sr)
    mix = np.zeros(n, dtype=np.float32)

    # Section drones
    place(mix, drone(110.0, 22.0, sr, 0.028), 0.0, sr)  # A2
    place(mix, drone(164.81, 22.0, sr, 0.012), 0.4, sr)  # E3
    place(mix, drone(130.81, 18.0, sr, 0.022), 18.0, sr)  # C3 transition
    place(mix, drone(146.83, 22.0, sr, 0.026), 32.0, sr)  # D3 hopeful
    place(mix, drone(220.0, 20.0, sr, 0.014), 34.0, sr)  # A3

    # Sparse piano-like notes (A minor → D major pentatonic)
    early = [
        (1.2, 220.00, 1.8, 0.045),
        (3.4, 261.63, 1.4, 0.028),
        (5.8, 246.94, 2.0, 0.036),
        (9.0, 196.00, 2.2, 0.04),
        (12.2, 220.00, 1.6, 0.03),
        (15.5, 174.61, 2.4, 0.038),
        (19.0, 196.00, 1.8, 0.032),
        (22.4, 246.94, 2.0, 0.03),
    ]
    late = [
        (27.2, 293.66, 1.6, 0.042),
        (29.6, 329.63, 1.8, 0.036),
        (32.8, 349.23, 2.2, 0.04),
        (36.0, 392.00, 2.0, 0.034),
        (39.2, 440.00, 2.4, 0.038),
        (43.0, 329.63, 2.0, 0.03),
        (46.2, 293.66, 2.6, 0.04),
        (49.4, 440.00, 3.2, 0.045),
        (51.0, 587.33, 2.8, 0.028),
    ]
    for t0, f, d, amp in early + late:
        place(mix, tone(f, d, sr, amp), t0, sr)
        # quiet fifth above, later only
        if t0 > 30:
            place(mix, tone(f * 1.5, d * 0.85, sr, amp * 0.35), t0 + 0.12, sr)

    # soft noise bed (paper grain)
    rng = np.random.default_rng(7)
    grain = rng.standard_normal(n).astype(np.float32) * 0.004
    # one-pole lowpass
    for i in range(1, n):
        grain[i] = 0.92 * grain[i - 1] + 0.08 * grain[i]
    mix += grain

    peak = np.max(np.abs(mix)) + 1e-9
    mix = mix / peak * 0.55
    return mix


def still_cover(src: Path, dst: Path, size=(1920, 1080)) -> None:
    im = Image.open(src).convert("RGB")
    tw, th = size
    scale = max(tw / im.width, th / im.height)
    nw, nh = int(im.width * scale), int(im.height * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    im = im.crop((left, top, left + tw, top + th))
    im.save(dst, quality=95)


def ken_burns(
    src: Path,
    dst: Path,
    seconds: float,
    kind: str,
) -> None:
    still = WRK / f"{dst.stem}_still.jpg"
    still_cover(src, still, (1920, 1080))
    frames = int(round(seconds * FPS))
    # crop window animates from start to end
    # start crop of 1600x900 inside 1920x1080, end crop of 1400x788, etc.
    if kind == "zoom_arm":
        # zoom toward lower-center (the glowing arm)
        z_expr = f"1+0.16*on/{frames}"
        x_expr = f"iw/2-(iw/zoom/2)-70"
        y_expr = f"ih/2-(ih/zoom/2)+90"
    elif kind == "push_faces":
        z_expr = f"1+0.12*on/{frames}"
        x_expr = "iw/2-(iw/zoom/2)"
        y_expr = f"ih/2-(ih/zoom/2)-20"
    elif kind == "pan_device":
        z_expr = "1.08"
        x_expr = f"(iw-iw/zoom)*on/{frames}"
        y_expr = "ih/2-(ih/zoom/2)"
    else:
        z_expr = f"1+0.08*on/{frames}"
        x_expr = "iw/2-(iw/zoom/2)"
        y_expr = "ih/2-(ih/zoom/2)"

    vf = (
        f"zoompan=z='{z_expr}':x='{x_expr}':y='{y_expr}':d=1:s={W}x{H}:fps={FPS},"
        f"fps={FPS},format=yuv420p"
    )
    ff(
        "-framerate",
        str(FPS),
        "-loop",
        "1",
        "-i",
        str(still),
        "-t",
        f"{seconds:.3f}",
        "-vf",
        vf,
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        str(dst),
    )


def normalize_clip(src: Path, dst: Path) -> None:
    vf = (
        f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
        f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0xF6F3EC,"
        f"fps={FPS},format=yuv420p,setsar=1"
    )
    ff(
        "-i",
        str(src),
        "-vf",
        vf,
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        str(dst),
    )


def make_card(
    path: Path,
    seconds: float,
    lines: list[tuple[str, int, str, int]],
    bg=PAPER,
    fade_in=0.4,
    fade_out=0.4,
) -> None:
    """lines: (text, size, fontpath, y)"""
    img = Image.new("RGB", (W, H), bg)
    draw = ImageDraw.Draw(img)
    for text, size, fontpath, y in lines:
        font = ImageFont.truetype(fontpath, size)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        x = (W - tw) // 2
        fill = INK if bg[0] > 80 else PAPER
        draw.text((x, y), text, font=font, fill=fill)
    still = WRK / f"{path.stem}_card.png"
    img.save(still)
    ff(
        "-loop",
        "1",
        "-framerate",
        str(FPS),
        "-i",
        str(still),
        "-t",
        f"{seconds:.3f}",
        "-vf",
        f"fps={FPS},format=yuv420p,fade=t=in:st=0:d={fade_in},fade=t=out:st={seconds - fade_out}:d={fade_out}",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        str(path),
    )


def srt_time(t: float) -> str:
    t = max(0.0, t)
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms = int(round((t - math.floor(t)) * 1000))
    if ms == 1000:
        s += 1
        ms = 0
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def vtt_time(t: float) -> str:
    t = max(0.0, t)
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"


def write_subs(cues: list[tuple[float, float, str]], srt: Path, vtt: Path, ass: Path) -> None:
    srt_lines = []
    vtt_lines = ["WEBVTT", "Kind: captions", "Language: en", ""]
    for i, (a, b, text) in enumerate(cues, 1):
        srt_lines += [str(i), f"{srt_time(a)} --> {srt_time(b)}", text, ""]
        vtt_lines += [f"{vtt_time(a)} --> {vtt_time(b)}", text.replace("\n", "\n"), ""]
    srt.write_text("\n".join(srt_lines))
    vtt.write_text("\n".join(vtt_lines))
    # ASS with outline, bottom-center, never huge
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Liberation Sans,28,&H00FFFFFF,&H000000FF,&HAA1C1B19,&H64000000,0,0,0,0,100,100,0.4,0,1,2.4,0.6,2,70,70,52,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for a, b, text in cues:
        def ass_t(t: float) -> str:
            h = int(t // 3600)
            m = int((t % 3600) // 60)
            s = t % 60
            return f"{h:d}:{m:02d}:{s:05.2f}"
        body = text.replace("\n", r"\N")
        events.append(f"Dialogue: 0,{ass_t(a)},{ass_t(b)},Default,,0,0,0,,{body}")
    ass.write_text(header + "\n".join(events) + "\n")


def main() -> None:
    chars, times, vo_dur = load_timestamps()
    print("VO duration", vo_dur)

    skip_visual = os.environ.get("SKIP_VISUAL") == "1" and (WRK / "picture.mp4").exists()

    if not skip_visual:
        title = WRK / "title.mp4"
        make_card(
            title,
            2.4,
            [
                ("VEINVISION", 54, FONT_SERIF, 300),
                ("a short film about seeing, and caring", 22, FONT_SANS, 390),
            ],
            fade_in=0.25,
            fade_out=0.45,
        )

        for i in range(1, 6):
            normalize_clip(SCN / f"s{i}.mp4", WRK / f"s{i}n.mp4")

        ken_burns(IMG / "6.png", WRK / "s6n.mp4", 7.5, "zoom_arm")
        ken_burns(IMG / "7.png", WRK / "s7n.mp4", 6.0, "push_faces")
        ken_burns(IMG / "8.png", WRK / "s8n.mp4", 6.5, "pan_device")

        tag = WRK / "tag.mp4"
        make_card(
            tag,
            4.2,
            [
                ("When you can see better,", 34, FONT_SERIF_I, 300),
                ("you can care better.", 34, FONT_SERIF_I, 360),
            ],
            fade_in=0.5,
            fade_out=0.5,
        )

        outro = WRK / "outro.mp4"
        make_card(
            outro,
            3.0,
            [
                ("SIA", 48, FONT_SANS_B, 280),
                ("Social Impact Award", 26, FONT_SANS, 350),
                ("Community Voting", 20, FONT_SANS, 400),
            ],
            bg=(28, 27, 25),
            fade_in=0.35,
            fade_out=0.5,
        )

        clips = [
            title,
            WRK / "s1n.mp4",
            WRK / "s2n.mp4",
            WRK / "s3n.mp4",
            WRK / "s4n.mp4",
            WRK / "s5n.mp4",
            WRK / "s6n.mp4",
            WRK / "s7n.mp4",
            WRK / "s8n.mp4",
            tag,
            outro,
        ]

        lst = WRK / "concat.txt"
        lst.write_text("".join(f"file '{c}'\n" for c in clips))
        raw = WRK / "picture.mp4"
        ff(
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(lst),
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            "-pix_fmt",
            "yuv420p",
            "-r",
            str(FPS),
            "-an",
            str(raw),
        )
    else:
        print("Skipping visual rebuild; using existing picture.mp4")
        raw = WRK / "picture.mp4"

    # get duration
    probe = subprocess.run(
        ["ffmpeg", "-i", str(raw)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    dur = 54.0
    for line in probe.stdout.splitlines():
        if "Duration:" in line:
            hms = line.split("Duration:")[1].split(",")[0].strip()
            hh, mm, ss = hms.split(":")
            dur = int(hh) * 3600 + int(mm) * 60 + float(ss)
            break
    print("picture duration", dur)

    # --- audio: place VO paragraphs on the picture timeline ---
    sr, vo = decode_vo()

    def seg(needle: str) -> np.ndarray:
        a, b = find_span(chars, times, needle)
        i, j = int(a * sr), int(min(b + 0.08, vo_dur) * sr)
        return vo[i:j]

    # designed placements (seconds on final timeline)
    # title 2.4, s1 6.04, s2 6.04, s3 6.04, s4 6.04, s5 6.04, s6 7.5, s7 6.0, s8 6.5, tag 4.2, outro 3.0
    t_title = 0.0
    t_s1 = 2.4
    t_s2 = t_s1 + 6.04
    t_s3 = t_s2 + 6.04
    t_s4 = t_s3 + 6.04
    t_s5 = t_s4 + 6.04
    t_s6 = t_s5 + 6.04
    t_s7 = t_s6 + 7.5
    t_s8 = t_s7 + 6.0
    t_tag = t_s8 + 6.5
    t_out = t_tag + 4.2

    placements: list[tuple[float, str, str]] = [
        (t_s1 + 0.35, "To a nurse, finding a vein can be routine.", "To a nurse, finding a vein can be routine."),
        (t_s1 + 3.35, "For a patient, it can feel like a long wait.", "For a patient, it can feel like a long wait."),
        (t_s2 + 0.15, "Sometimes painful.", "Sometimes painful."),
        (
            t_s2 + 1.7,
            "But sometimes, the technology meant to help still leaves the moment frustrating.",
            "But sometimes, the technology meant to help\nstill leaves the moment frustrating.",
        ),
        (
            t_s3 + 0.55,
            "Because behind every vein is a person waiting to feel reassured.",
            "Because behind every vein\nis a person waiting to feel reassured.",
        ),
        (
            t_s4 + 0.7,
            "Then another nurse noticed, and offered a different way.",
            "Then another nurse noticed —\nand offered a different way.",
        ),
        (t_s5 + 0.7, "She picked up VeinVision.", "She picked up VeinVision."),
        (
            t_s6 + 0.8,
            "And this time, she could see the veins more clearly.",
            "And this time, she could see\nthe veins more clearly.",
        ),
        (t_s7 + 0.5, "Less hesitation. Less waiting.", "Less hesitation. Less waiting."),
        (
            t_s7 + 2.6,
            "And a patient who feels a little more at ease.",
            "And a patient who feels\na little more at ease.",
        ),
        (
            t_tag + 0.45,
            "When you can see better, you can care better.",
            "When you can see better,\nyou can care better.",
        ),
    ]

    vo_mix = np.zeros(int(dur * sr) + sr, dtype=np.float32)
    cues: list[tuple[float, float, str]] = []
    for t0, needle, sub in placements:
        clip = seg(needle)
        place(vo_mix, clip, t0, sr)
        cues.append((t0 - 0.04, t0 + len(clip) / sr + 0.18, sub))

    score = make_score(sr, dur + 0.3)

    # duck score under voice
    win = int(0.18 * sr)
    vo_env = np.abs(vo_mix[: len(score)])
    kernel = np.hanning(win * 2 + 1)
    kernel /= kernel.sum()
    vo_env = np.convolve(vo_env, kernel, mode="same")
    duck = 1.0 - 0.78 * np.clip(vo_env / 0.08, 0, 1)
    mixed = score * duck + vo_mix[: len(score)] * 0.98
    peak = np.max(np.abs(mixed)) + 1e-9
    mixed = mixed / peak * 0.92

    mix_wav = AUD / "mix.wav"
    write_wav(mix_wav, sr, mixed)

    srt = WRK / "subs.srt"
    vtt = PUB / "captions.vtt"
    ass = WRK / "subs.ass"
    write_subs(cues, srt, vtt, ass)

    # burn subtitles + mix audio + intro/out fades
    final = PUB / "veinvision.mp4"
    vf = (
        f"fade=t=in:st=0:d=0.6:color=0xF6F3EC,"
        f"fade=t=out:st={dur - 0.7:.2f}:d=0.7,"
        f"ass={ass.name}"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(raw),
            "-i",
            str(mix_wav),
            "-vf",
            vf,
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "17",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "44100",
            "-ac",
            "2",
            "-shortest",
            "-movflags",
            "+faststart",
            str(final),
        ],
        cwd=str(WRK),
    )

    # poster from scene 6 still
    poster = PUB / "poster.jpg"
    still_cover(IMG / "6.png", poster, (1280, 720))

    # chapter metadata for the app
    chapters = [
        {"id": "title", "t": t_title, "title": "VeinVision"},
        {"id": "wait", "t": t_s1, "title": "The wait"},
        {"id": "red", "t": t_s2, "title": "The red light"},
        {"id": "person", "t": t_s3, "title": "A person waiting"},
        {"id": "offer", "t": t_s4, "title": "A different way"},
        {"id": "device", "t": t_s5, "title": "VeinVision"},
        {"id": "see", "t": t_s6, "title": "Seeing clearly"},
        {"id": "ease", "t": t_s7, "title": "At ease"},
        {"id": "how", "t": t_s8, "title": "The device"},
        {"id": "message", "t": t_tag, "title": "The message"},
    ]
    (PUB / "chapters.json").write_text(json.dumps({"duration": dur, "chapters": chapters, "cues": [
        {"start": a, "end": b, "text": text} for a, b, text in cues
    ]}, indent=2))

    print("WROTE", final, "dur", dur)
    print("chapters", json.dumps(chapters, indent=2))


if __name__ == "__main__":
    main()
