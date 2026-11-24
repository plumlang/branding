# Plumlang for Visual Studio Code

Language support for [Plumlang](https://plum.elixpo.com), a small, fast,
memory-safe programming language.

## Requirements

The language features come from `plum lsp`, the language server built into
the `plum` binary, so **Plumlang must be installed**: see
[plum.elixpo.com/docs/install](https://plum.elixpo.com/docs/install/). The
extension runs `plum` from your `PATH`, or the binary the `plum.path` setting
names. If it can't find `plum`, it says so once, with a link to the install
page; highlighting and the icons work either way.

## Features

From the language server (`plum lsp`):

- **Diagnostics** as you type: every error and warning `plum check` reports,
  with the same codes and messages.
- **Hover**: the type of a name or expression, and the signature of functions,
  methods and standard-library functions.
- **Go to definition**: variables, functions, trees, fields, methods, kinds
  and their cases, including names imported from other files with `seed`.
- **Completion**: the names in scope, keywords, and members after a `.`
  (fields and methods, list, map and str methods, standard-library modules).
- **Outline** (document symbols) and breadcrumbs.
- **Format Document**, in `plum fmt`'s layout.
- Imports between open files use what is in the editor, saved or not.

In the extension itself:

- Syntax highlighting for `.plum` files, block comments `#[ ... ]#` and `##` doc comments included.
- Bracket matching, auto-closing pairs, comment toggling and indentation.
- **Plum: Run File** (also the ▶ button in the editor title): saves the file
  and runs `plum run <file>` in a terminal.
- **Plum: Restart Language Server**.
- A file icon for `.plum` files, in two icon themes: **Plum Icons** (based on
  Seti) and **Plum Icons (Material)** (based on Material Icon Theme).

## Settings

| Setting | Default | |
|---|---|---|
| `plum.path` | `plum` | The `plum` binary: `plum` on `PATH`, or a full path. User settings only. |
| `plum.lsp.enabled` | `true` | Run the language server. Turn it off to keep only highlighting. |

## Getting started

1. Install Plumlang: see [plum.elixpo.com/docs/install](https://plum.elixpo.com/docs/install/).
2. Install this extension and open a `.plum` file.
3. On first use you are offered the Plum file icon theme. You can change it
   at any time with **Preferences: File Icon Theme**.

Other editors (Neovim, Helix, Zed, Emacs) can use the same language server:
see [docs/lsp.md](https://github.com/plumlang/plumlang/blob/main/docs/lsp.md).

## Licence

The extension is part of [plumlang/branding](https://github.com/plumlang/branding).
Plumlang and the Plumlang logo are trademarks of Elixpo. The Material icons
are used under the licence in `icons/material-icons-LICENSE.txt`.
