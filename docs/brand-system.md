# Plumlang brand system

**Status:** Draft, awaiting maintainer review
**Parent system:** [Elixpo Open Field](https://github.com/elixpo/elixpo/blob/main/docs/brand-system.md)
**Tokens:** [`brand/palette.json`](../brand/palette.json)

Plumlang is an Elixpo production. Its identity is a project identity inside
Open Field. It uses Elixpo's paper, ink, grid and metadata patterns, and adds one
thing of its own: the plum. Anything not covered here follows Open Field.

## The two registers

Plumlang has two visual registers. Each surface uses one of them, never both
at once.

| Register | Mark | Where |
|---|---|---|
| **Open Field** (default) | [`plum-mark.svg`](../brand/marks/plum-mark.svg): a flat plum with a seam, a stem and a leaf | Website, documentation, social cards, README headers, the package icon, anything a newcomer meets first |
| **Pixel** (community) | [`plum-pixel.svg`](../brand/marks/plum-pixel.svg): the original 40×40 pixel plum with a code glyph | The org profile cover, the editor's file icon, stickers, events, release announcements, playful moments |

The Open Field register says "this is a serious, well-made language". The
pixel register says "and it is fun to write". The org cover
([`references/org-cover.png`](../references/org-cover.png)) is the reference
for the pixel register.

## The mark

The Open Field mark is a plum built from four shapes:

- **The fruit:** a circle in Plum `#5B2A86`.
- **The seam:** a curved line in Plum deep `#3A2150`, running from the stem to
  the base. It doubles as an opening bracket: the place where code begins.
- **The stem:** Stem `#B5701E`. The stem colour is used nowhere else.
- **The leaf:** Field green `#18A466`, the colour Plumlang shares with Elixpo.

A soft highlight in Plum light `#8E5CC2` sits on the right shoulder.

Variants:

| File | Use |
|---|---|
| [`brand/marks/plum-mark.svg`](../brand/marks/plum-mark.svg) | The full-colour mark. The default. |
| [`brand/marks/plum-mark-mono.svg`](../brand/marks/plum-mark-mono.svg) | One colour, drawn in `currentColor`. For single-colour print, embossing, and UI glyphs. |
| [`brand/marks/plum-pixel.svg`](../brand/marks/plum-pixel.svg) | The pixel register. Render it with `crispEdges` and scale in whole multiples. |

Rules:

- Keep clear space of at least one leaf-width around the mark.
- The smallest size is 16 px. At 16 px and 32 px use the rendered PNGs in
  [`icons/`](../icons/), which are checked for legibility.
- Do not recolour, outline, rotate, add shadows or gradients, or put the mark on
  a busy image. On dark fields, the full-colour mark sits on Plum night
  `#24143A` or Ink `#142018`.
- Do not redraw the seam as a literal `{` or `</>`; the pixel mark already
  carries the code glyph.

## Wordmark

The name is **Plumlang**: one word, capital P. "Plum" is acceptable in running
text after the first mention, and as the command `plum`. Never "PlumLang",
"Plum-lang" or "PLUMLANG".

The wordmark is set, not drawn: the platform sans at semibold weight in Ink,
next to the mark at a height of 0.42 of the mark. The pipeline renders the
lockups, so the type is always spelled and spaced correctly.

## Colour

Open Field colours keep their Open Field roles. Plumlang adds the plum family.

| Token | Hex | Role |
|---|---|---|
| Paper | `#F6F5F0` | Page field and card background |
| Ink | `#142018` | Text, dark panels, high-emphasis controls |
| Archive warm | `#F0E6D3` | Quiet secondary fields, provenance |
| Field green | `#18A466` | The leaf; small highlights |
| Foundry green | `#0B623C` | The "An Elixpo production" line |
| **Plum** | `#5B2A86` | Primary project colour: the fruit, links, active states |
| **Plum deep** | `#3A2150` | The seam, dark accents, code panels |
| **Plum night** | `#24143A` | Dark-theme field |
| **Plum light** | `#8E5CC2` | Highlight on the fruit; large accents on dark fields |
| **Plum mist** | `#C9A8EE` | Links and small accents on dark fields |
| **Stem** | `#B5701E` | The stem only |

Contrast (WCAG 2.1):

| Pair | Ratio | Allowed for |
|---|---|---|
| Plum on Paper | 9.1:1 | Any text |
| Ink on Paper | 15.4:1 | Any text |
| Paper on Plum night | 15.6:1 | Any text |
| Plum mist on Plum night | 8.3:1 | Any text |
| Plum light on Paper | 4.3:1 | Large text and graphics only |
| Plum light on Plum night | 3.6:1 | Large text and graphics only |
| Field green on Paper | 2.9:1 | Graphics only, never text |

Colour never carries meaning alone; a label or icon says the same thing.

## Typography

Open Field typography, unchanged:

- **Sans** for interface, body, headlines and the wordmark.
- **Serif** as an editorial accent for one short clause: a card headline, a
  pull quote. Never for code or long text.
- **Mono** for code, versions, dates, commands and metadata.

The renderer looks for the families in `palette.json` in order and records the
font it used in [`brand/provenance.json`](../brand/provenance.json).

## Code samples

Code is part of the brand: every social card and hero shows real Plumlang that
passes `plum check`. Keywords keep the garden theme (`plant`, `root`, `branch`,
`tree`, `seed`, `drop`, `good`, `bad`). Code panels use Plum night with Paper
text and Plum mist keywords.

## Social cards

Social cards are 1280×720 (Open Graph) and 1280×640 (GitHub social preview):

- Paper field with a faint dot grid on the right half.
- The mark at the right, large and calm.
- Left column: a mono eyebrow, a serif headline of one clause, a sans line of
  description, and the URL in mono.
- "An Elixpo production" in Foundry green at the foot.

Card text lives in [`prompts/og/`](../prompts/og/); the renderer composes the
cards. No card is drawn by hand, and no generated image may contain lettering.

## Asset tiers

The repository follows Elixpo's separation of tiers:

| Tier | Folder | Rule |
|---|---|---|
| Editable masters | [`brand/`](../brand/) | Hand-edited SVG and tokens. The only files a designer changes. |
| Web derivatives | [`icons/`](../icons/), [`og/`](../og/), [`social/`](../social/) | Rendered by [`pipeline/build.py`](../pipeline/build.py). Never edited by hand. |
| Prompts and text | [`prompts/`](../prompts/) | Card text, and prompts for any future generated artwork. |
| References | [`references/`](../references/) | Approved material the masters are judged against. |
| Product | [`vscode/`](../vscode/) | The VS Code extension, which consumes the derivatives. |

Every derivative is listed in `brand/provenance.json` with its source and a
SHA-256 checksum. CI fails if a derivative drifts from its master.

## Mascot

Oreo, Elixpo's mascot, does not appear on Plumlang's product surfaces. It may
appear on Elixpo community material that features Plumlang, under the
[Oreo rules](https://github.com/elixpo/elixpo/blob/main/brand/MASCOT.md).

## Trademarks

Plumlang and the Plumlang logo are trademarks of Elixpo. Use of the marks
follows Plumlang's
[TRADEMARKS.md](https://github.com/plumlang/plumlang/blob/main/TRADEMARKS.md).
