# Changelog

## 1.0.1

- Highlighting follows the current language
  ([plumlang/branding#8](https://github.com/plumlang/branding/issues/8)): every keyword (`seed`, `trait`, `kind`,
  `match`, `try`/`catch`/`finally`/`throw`, `spawn`, `weak`, `self`, `super`, `is`, `as`, ...), `good`/`bad` and
  `true`/`false`, and numbers in hex, octal and binary, with `_` separators and exponents. String escapes,
  `{...}` interpolation highlighted as code, formats such as `{price:.2}`, and `"""` strings. Names of trees,
  traits, kinds, functions, constants and built-in types.
- Removed what Plumlang doesn't have: `elif`, `void`, `#[ ... ]#` block comments, `++`, `&&`, `||`.
- Indentation follows brackets; `"` doesn't auto-close inside strings and comments.
- The grammar is tested against Plumlang's shared highlighting sample in CI.

## 1.0.0

- The first stable release of the Plumlang extension.
- Language support through `plum lsp`: errors as you type, hover, go to definition, completion, document symbols
  and formatting. Needs `plum` on your `PATH`
  (`curl -fsSL https://plum.elixpo.com/install.sh | sh`, `irm https://plum.elixpo.com/install.ps1 | iex`, or
  `brew install plumlang/tap/plum`), or set `plum.path`.
- Commands: **Plum: Run File** and **Plum: Restart Language Server**.
- Syntax highlighting for `.plum` files, and the Plumlang file icon.

## 0.2.0

- The language client for `plum lsp`.

## 0.1.x

- Syntax highlighting and the `.plum` file type.
