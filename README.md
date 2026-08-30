# 🍑 Plum Language

Syntax highlighting and language support for the Plum programming language in VS Code.

## Features

- **Syntax highlighting** for `.plum` files — keywords, strings, numbers, operators, comments, and constants
- **Language configuration** — auto-closing brackets/quotes, comment toggling (`//`), bracket matching
- **Custom file icons** for `.plum` files, available as two icon theme options:
  - **Plum Icons** — based on the built-in Seti theme, with a custom Plum icon added
  - **Plum Icons (Material)** — based on Material Icon Theme, with a custom Plum icon added
- **Run command** — `Plum: Run File` (`plum.runFile`) placeholder command, ready to be wired up to a Plum interpreter

## Getting started

1. Install the extension
2. Open any `.plum` file — syntax highlighting applies automatically
3. On first activation, you'll be prompted to enable a Plum file icon theme (Seti-based or Material-based). You can also set it manually anytime via **Preferences: File Icon Theme**

## Example

```plum
// Plum example
let x = 42
func greet(name) {
    drop "Hello, " + name
}

if x > 10 {
    greet("world")
}
```

## Roadmap

- Language server (autocomplete, diagnostics)
- Debugger integration
- Wire up `Plum: Run File` to an actual Plum interpreter

## Attribution

The "Plum Icons" and "Plum Icons (Material)" icon themes bundle icon sets from VS Code's built-in Seti theme and the [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) extension (MIT licensed), with a custom Plum file icon added on top.
