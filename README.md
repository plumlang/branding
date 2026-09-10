# 🍑 Plum Language

🔆 Syntax highlighting and language support for the Plum programming language in VS Code.

## Features

- **Syntax highlighting** for `.plum` files — keywords, strings, numbers, operators, comments, constants, types, and functions
- **Language configuration** — auto-closing brackets/quotes, comment toggling (`--`), bracket matching, auto-indentation for blocks
- **Custom file icons** for `.plum` files, available as two icon theme options:
  - **Plum Icons** — based on the built-in Seti theme, with a custom Plum icon added
  - **Plum Icons (Material)** — based on Material Icon Theme, with a custom Plum icon added
- **Run command** — `Plum: Run File` (`plum.runFile`) placeholder command, ready to be wired up to a Plum interpreter

## Getting started

1. Install the extension
2. Open any `.plum` file — syntax highlighting applies automatically
3. On first activation, you'll be prompted to enable a Plum file icon theme (Seti-based or Material-based). You can also set it manually anytime via **Preferences: File Icon Theme**

## Example

```tsx
-- Plum example
root int MAX = 100

branch int add(int a, int b) {
    return a + b
}

branch void greet(str name) {
    drop "Hello, " + name
}

plant int result = add(5, 3)
drop result

if result > 10 {
    greet("world")
} else {
    greet("plum")
}
