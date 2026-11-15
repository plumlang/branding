# Social cards

One folder per surface, one Markdown file per card. The renderer
([`pipeline/build.py`](../../pipeline/build.py)) reads each file and writes
`og/<folder>/<name>.png`.

| Block | Required | Content |
|---|---|---|
| `## Text` | yes | `eyebrow`, `headline`, `sub`, `url`, and optionally `size` (default `1280x720`) |
| `## Code` | no | A fenced `plum` block shown in a code panel. It must pass `plum check`. |

The layout, colours and type come from the
[brand system](../../docs/brand-system.md#social-cards). To add a card, add a
file and run `python pipeline/build.py`.

Every card is composed by code; no generated image may contain lettering.
Prompts for any generated artwork, when there is some, live beside the card
they belong to under a `## Prompt` block.
