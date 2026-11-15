"""Render Plumlang's brand derivatives from the masters in brand/.

    brand/marks/*.svg + brand/palette.json + prompts/og/**/*.md
        -> icons/      the mark as PNG at every size, and favicon.ico
        -> social/     avatar and lockups
        -> og/         social cards (1280x720) and repository previews (1280x640)
        -> brand/provenance.json   source, checksum and font of every output

Usage:
    python pipeline/build.py           render everything
    python pipeline/build.py --check   verify provenance without rendering

--check needs only the standard library. It fails when a master changed
without the derivatives being rendered again, when an output is missing, or
when an output was edited by hand. CI runs it.
"""

import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "brand"
MARK = BRAND / "marks" / "plum-mark.svg"
PIXEL = BRAND / "marks" / "plum-pixel.svg"
PALETTE = BRAND / "palette.json"
PROVENANCE = BRAND / "provenance.json"
PROMPTS = ROOT / "prompts" / "og"

ICON_SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 512]

# Copies the extension ships; they must match the masters byte for byte.
MIRRORS = {"vscode/icons/plum-icon.svg": "brand/marks/plum-pixel.svg"}


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def rel(path):
    return Path(path).resolve().relative_to(ROOT).as_posix()


# ── check ────────────────────────────────────────────────────────────────────


def check():
    if not PROVENANCE.exists():
        print("brand/provenance.json is missing; run pipeline/build.py")
        return 1
    record = json.loads(PROVENANCE.read_text())
    problems = []
    for src, digest in record["sources"].items():
        path = ROOT / src
        if not path.exists():
            problems.append(f"{src}: source is missing")
        elif sha256(path) != digest:
            problems.append(f"{src}: changed since the last render; run pipeline/build.py")
    for out in record["outputs"]:
        path = ROOT / out["path"]
        if not path.exists():
            problems.append(f"{out['path']}: missing")
        elif sha256(path) != out["sha256"]:
            problems.append(f"{out['path']}: differs from its recorded checksum")
    for copy, master in MIRRORS.items():
        if sha256(ROOT / copy) != sha256(ROOT / master):
            problems.append(f"{copy}: differs from its master {master}")
    for line in problems:
        print(line)
    if not problems:
        print(f"ok: {len(record['outputs'])} outputs match their sources")
    return 1 if problems else 0


# ── rendering ────────────────────────────────────────────────────────────────


def hex_rgb(h):
    return tuple(int(h[i : i + 2], 16) for i in (1, 3, 5))


def find_font(families, style):
    """The first installed family, through fontconfig; None if there is none."""
    for family in families:
        try:
            out = subprocess.run(
                ["fc-match", "-f", "%{family}\n%{file}", f"{family}:{style}"],
                capture_output=True, text=True, check=True,
            ).stdout.split("\n")
        except (OSError, subprocess.CalledProcessError):
            return None
        if len(out) == 2 and family.lower() in out[0].lower():
            return out[1]
    return None


class Kit:
    """Palette, fonts and the rendered mark, shared by every output."""

    def __init__(self):
        from PIL import ImageFont  # noqa: F401  (fail early with a clear error)

        palette = json.loads(PALETTE.read_text())
        self.c = {k: hex_rgb(v["hex"]) for k, v in palette["colours"].items()}
        t = palette["type"]
        self.font_files = {
            "sans": find_font(t["sans"], "weight=180"),  # semibold
            "sans-regular": find_font(t["sans"], "weight=80"),
            "serif": find_font(t["serif"], "weight=80"),
            "mono": find_font(t["mono"], "weight=80"),
        }
        missing = [k for k, v in self.font_files.items() if v is None]
        if missing:
            sys.exit(f"no installed font for: {', '.join(missing)} (see brand/palette.json)")

    def font(self, kind, size):
        from PIL import ImageFont

        return ImageFont.truetype(self.font_files[kind], size)

    def mark(self, size, svg=MARK):
        import io

        import cairosvg
        from PIL import Image

        png = cairosvg.svg2png(url=str(svg), output_width=size, output_height=size)
        return Image.open(io.BytesIO(png)).convert("RGBA")


def save(img, path, outputs, source, kit=None, fonts=()):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    entry = {"path": rel(path), "source": source}
    if fonts:
        entry["fonts"] = sorted({Path(kit.font_files[f]).name for f in fonts})
    outputs.append(entry)


def render_icons(kit, outputs):
    from PIL import Image

    for size in ICON_SIZES:
        save(kit.mark(size), ROOT / "icons" / f"plum-mark-{size}.png", outputs, rel(MARK))
    ico = ROOT / "icons" / "favicon.ico"
    kit.mark(256).save(ico, sizes=[(16, 16), (32, 32), (48, 48)])
    outputs.append({"path": rel(ico), "source": rel(MARK)})
    # apple-touch-icon: the mark on Paper, no transparency
    tile = Image.new("RGBA", (180, 180), kit.c["paper"] + (255,))
    tile.alpha_composite(kit.mark(140), (20, 20))
    save(tile.convert("RGB"), ROOT / "icons" / "apple-touch-icon.png", outputs, rel(MARK))
    # the pixel mark at whole multiples of its 40-cell grid
    for size in (40, 80, 160, 480):
        save(kit.mark(size, PIXEL), ROOT / "icons" / f"plum-pixel-{size}.png", outputs, rel(PIXEL))


def render_social(kit, outputs):
    from PIL import Image, ImageDraw

    # org and repository avatar: the mark centred on Paper
    avatar = Image.new("RGBA", (512, 512), kit.c["paper"] + (255,))
    avatar.alpha_composite(kit.mark(400), (56, 50))
    save(avatar.convert("RGB"), ROOT / "social" / "avatar-512.png", outputs, rel(MARK))

    # horizontal lockups: mark + wordmark, on light and dark fields
    for name, field, ink in (("light", "paper", "ink"), ("dark", "plum-night", "paper")):
        h, mark = 240, 200
        font = kit.font("sans", int(mark * 0.42))
        probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
        tw = probe.textbbox((0, 0), "Plumlang", font=font)[2]
        w = 20 + mark + 24 + tw + 40
        img = Image.new("RGBA", (w, h), kit.c[field] + (255,))
        img.alpha_composite(kit.mark(mark), (20, (h - mark) // 2 + 4))
        d = ImageDraw.Draw(img)
        d.text((20 + mark + 24, h // 2 + 14), "Plumlang", font=font, fill=kit.c[ink], anchor="ls")
        save(img.convert("RGB"), ROOT / "social" / f"lockup-{name}.png", outputs, rel(MARK), kit, ["sans"])


def read_card(md):
    """The `## Text` block of a card prompt as a dict, plus its `## Code` block."""
    text = md.read_text()
    fields = {}
    block = re.search(r"^## Text\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    if not block:
        sys.exit(f"{rel(md)}: no '## Text' block")
    for line in block.group(1).splitlines():
        m = re.match(r"^-?\s*(\w+):\s*(.+)$", line.strip())
        if m:
            fields[m.group(1)] = m.group(2).strip()
    code = re.search(r"^## Code\n+```plum\n(.*?)```", text, re.S | re.M)
    fields["code"] = code.group(1).rstrip("\n") if code else None
    size = fields.get("size", "1280x720")
    fields["size"] = tuple(int(n) for n in size.split("x"))
    return fields


def wrap(draw, text, font, width):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=font) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    return lines + ([line] if line else [])


def render_card(kit, md, out, outputs):
    from PIL import Image, ImageDraw

    f = read_card(md)
    W, H = f["size"]
    c = kit.c
    img = Image.new("RGBA", (W, H), c["paper"] + (255,))
    d = ImageDraw.Draw(img)
    margin, col = 84, 640

    # dot grid on the right half, behind everything
    for y in range(36, H - 24, 28):
        for x in range(W // 2 + 40, W - 24, 28):
            d.ellipse((x - 1.5, y - 1.5, x + 1.5, y + 1.5), fill=(214, 210, 200, 255))

    # right side: a code panel when the card has one, else the mark alone
    if f["code"]:
        size = 150
        img.alpha_composite(kit.mark(size), (W - margin - size + 20, 48))
        lines = f["code"].splitlines()
        room = W - margin - (col + 48)  # the panel stays right of the text column
        ms = 22
        while ms > 13:
            mono = kit.font("mono", ms)
            if max(d.textlength(l, font=mono) for l in lines) + 64 <= room:
                break
            ms -= 1
        step = int(ms * 1.55)
        pw = int(max(d.textlength(l, font=mono) for l in lines)) + 64
        ph = len(lines) * step + 48
        px, py = W - margin - pw, max(48 + size + 16, (H - ph) // 2 + 40)
        d.rounded_rectangle((px, py, px + pw, py + ph), radius=18, fill=c["plum-night"])
        keywords = {"plant", "root", "branch", "tree", "seed", "drop", "return",
                    "if", "else", "for", "in", "while", "match", "good", "bad"}
        for i, line in enumerate(lines):
            x, y = px + 32, py + 24 + ms + i * step
            for tok in re.split(r"(\s+|\"[^\"]*\")", line):
                if not tok:
                    continue
                if tok.startswith('"'):
                    colour = c["archive-warm"]
                elif tok in keywords:
                    colour = c["plum-mist"]
                else:
                    colour = c["paper"]
                d.text((x, y), tok, font=mono, fill=colour, anchor="ls")
                x += d.textlength(tok, font=mono)
    else:
        size = int(H * 0.62)
        img.alpha_composite(kit.mark(size), (W - margin - size + 10, (H - size) // 2))

    # left column: eyebrow, serif headline, sans line, url
    eyebrow = kit.font("mono", 20)
    d.text((margin, 120), f.get("eyebrow", "").upper(), font=eyebrow, fill=c["plum"])
    hs = 76
    while hs > 44:
        head = kit.font("serif", hs)
        lines = wrap(d, f["headline"], head, col - margin)
        if len(lines) <= 3:
            break
        hs -= 4
    y = 170
    for line in lines:
        d.text((margin, y), line, font=head, fill=c["ink"])
        y += int(hs * 1.12)
    d.line((margin, y + 18, margin + 72, y + 18), fill=c["plum"], width=4)
    sub = kit.font("sans-regular", 27)
    y += 46
    for line in wrap(d, f.get("sub", ""), sub, col - margin):
        d.text((margin, y), line, font=sub, fill=(70, 78, 72))
        y += 38
    foot = kit.font("mono", 20)
    d.text((margin, H - 96), f.get("url", ""), font=foot, fill=c["ink"])
    d.text((margin, H - 64), "An Elixpo production", font=kit.font("sans-regular", 20), fill=c["foundry-green"])

    save(img.convert("RGB"), out, outputs, rel(md), kit, ["serif", "sans-regular", "mono"])


def render_cards(kit, outputs):
    for md in sorted(PROMPTS.glob("*/*.md")):
        if md.name in ("README.md", "STYLE.md"):
            continue
        render_card(kit, md, ROOT / "og" / md.parent.name / f"{md.stem}.png", outputs)


def build():
    kit = Kit()
    outputs = []
    for folder in ("icons", "social", "og"):
        shutil.rmtree(ROOT / folder, ignore_errors=True)
    for copy, master in MIRRORS.items():
        shutil.copyfile(ROOT / master, ROOT / copy)
    render_icons(kit, outputs)
    render_social(kit, outputs)
    render_cards(kit, outputs)
    for out in outputs:
        out["sha256"] = sha256(ROOT / out["path"])
    sources = sorted({o["source"] for o in outputs} | {rel(PALETTE)})
    record = {
        "generator": "pipeline/build.py",
        "note": "Generated. Do not edit; run pipeline/build.py after changing a master.",
        "sources": {s: sha256(ROOT / s) for s in sources},
        "outputs": outputs,
    }
    PROVENANCE.write_text(json.dumps(record, indent=2) + "\n")
    print(f"rendered {len(outputs)} outputs")


if __name__ == "__main__":
    sys.exit(check() if "--check" in sys.argv[1:] else build())
