// Checks syntaxes/plum.tmLanguage.json against Plumlang's shared highlighting
// sample (plumlang's tests/highlight/: keywords.txt and sample.plum).
//
//   1. every keyword in the lexer's list is scoped as a keyword (keyword.*,
//      storage.*, constant.language.* or variable.language.*);
//   2. every token `plum tokens` reports in sample.plum gets the right scope:
//      keywords as above, numbers constant.numeric.*, strings string.*,
//      interpolation formats constant.other.format-spec, and names and
//      operators neither string (outside an interpolation) nor comment;
//   3. every comment in the sample is a comment (`#`, `##`, and every
//      character of nested `#[ ... ]#` block comments), and every `#` inside
//      a string is not.
//
// Tokens inside block comments are left out of 2, so a `plum` older than
// block comments (it reads them as code) still checks the rest.
//
// Usage: node test/grammar.test.js [dir]
//   dir holds keywords.txt and sample.plum (e.g. ../../plumlang/tests/highlight);
//   without it they are downloaded from plumlang's main branch. Needs `plum`
//   on the PATH, or its path in $PLUM.
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const vsctm = require("vscode-textmate");
const oniguruma = require("vscode-oniguruma");

const BASE = "https://raw.githubusercontent.com/plumlang/plumlang/main/tests/highlight";

async function load(dir, name) {
  if (dir) return fs.readFileSync(path.join(dir, name), "utf8");
  const res = await fetch(`${BASE}/${name}`);
  if (!res.ok) throw new Error(`${BASE}/${name}: ${res.status}`);
  return res.text();
}

async function grammar() {
  const wasm = fs.readFileSync(require.resolve("vscode-oniguruma/release/onig.wasm"));
  await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
  const registry = new vsctm.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (s) => new oniguruma.OnigScanner(s),
      createOnigString: (s) => new oniguruma.OnigString(s),
    }),
    loadGrammar: async () => {
      const file = path.join(__dirname, "..", "syntaxes", "plum.tmLanguage.json");
      return vsctm.parseRawGrammar(fs.readFileSync(file, "utf8"), file);
    },
  });
  return registry.loadGrammar("source.plum");
}

// The scope stack of every character, as scopes[line][column], both 0-based.
function scopesOf(g, text) {
  let state = vsctm.INITIAL;
  return text.split("\n").map((line) => {
    const r = g.tokenizeLine(line, state);
    state = r.ruleStack;
    const at = [];
    for (const t of r.tokens) for (let i = t.startIndex; i < t.endIndex; i++) at[i] = t.scopes;
    return at;
  });
}

// plum's columns count code points; JavaScript's count UTF-16 units.
function charIndex(line, points) {
  let i = 0;
  for (const ch of line) {
    if (points-- <= 0) break;
    i += ch.length;
  }
  return i;
}

const isKeyword = (s) => /^(keyword|storage|constant\.language|variable\.language)\./.test(s);
// In a string, and not in an interpolation's code. (`seed ./path` is
// string.unquoted.path, like tree-sitter's path node, though plum lexes it
// as names and operators.)
const inString = (stack) => {
  const last = stack.findLastIndex((s) => s.startsWith("string.") && !s.startsWith("string.unquoted.path"));
  return last >= 0 && !stack.slice(last).some((s) => s.startsWith("meta.interpolation"));
};

// Where comments start in Plumlang source (a `#` outside a string), every
// character of block comments (as "line:column" keys), and the `#`s inside
// strings: following strings, escapes, """ strings, {interpolation} with
// nested brackets and nested #[ ]#. Positions are [line, column], 0-based.
function hashes(text) {
  const comments = [], inStrings = [], inBlocks = new Set();
  const mode = []; // "s" in a "string, "t" in a """string, "{" in code inside an interpolation
  let line = 0, col = 0;
  for (let i = 0; i < text.length; i++, col++) {
    const c = text[i], top = mode[mode.length - 1];
    if (c === "\n") { line++; col = -1; if (top === "s") mode.pop(); continue; }
    if (top === "s" || top === "t") {
      if (c === "#") inStrings.push([line, col]);
      if (c === "\\") { i++; col++; }
      else if (c === "{") mode.push("{");
      else if (top === "t" && text.startsWith('"""', i)) { mode.pop(); i += 2; col += 2; }
      else if (top === "s" && c === '"') mode.pop();
      continue;
    }
    if (text.startsWith("#[", i)) {
      comments.push([line, col]);
      let depth = 0;
      for (; i < text.length; i++, col++) {
        if (text[i] === "\n") { line++; col = -1; continue; }
        inBlocks.add(`${line}:${col}`);
        if (text.startsWith("#[", i)) { depth++; inBlocks.add(`${line}:${col + 1}`); i++; col++; }
        else if (text.startsWith("]#", i)) {
          depth--; inBlocks.add(`${line}:${col + 1}`); i++; col++;
          if (depth === 0) break;
        }
      }
      continue;
    }
    if (c === "#") { comments.push([line, col]); while (i + 1 < text.length && text[i + 1] !== "\n") { i++; col++; } continue; }
    if (text.startsWith('"""', i)) { mode.push("t"); i += 2; col += 2; }
    else if (c === '"') mode.push("s");
    else if (c === "{" || c === "(" || c === "[") mode.push(c);
    else if (c === "}" || c === ")" || c === "]") mode.pop();
  }
  return { comments, inStrings, inBlocks };
}

(async () => {
  const dir = process.argv[2];
  const [keywords, sample, g] = await Promise.all([
    load(dir, "keywords.txt").then((t) => t.split("\n").filter(Boolean)),
    load(dir, "sample.plum"),
    grammar(),
  ]);
  const problems = [];

  // 1. Each keyword on its own is highlighted as one.
  for (const word of keywords) {
    const scopes = scopesOf(g, word)[0];
    const leaf = scopes[0][scopes[0].length - 1];
    if (scopes.some((s) => s !== scopes[0]) || !isKeyword(leaf)) {
      problems.push(`keyword '${word}' is not highlighted as a keyword (${leaf})`);
    }
  }

  // 2. Every token of the sample, as plum lexes it.
  const lines = sample.split("\n");
  const scopes = scopesOf(g, sample);
  const plum = process.env.PLUM || "plum";
  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "plum-"));
  fs.writeFileSync(path.join(tmp, "sample.plum"), sample);
  const tokens = execFileSync(plum, ["tokens", path.join(tmp, "sample.plum")], { encoding: "utf8" });
  fs.rmSync(tmp, { recursive: true });
  const { comments, inStrings, inBlocks } = hashes(sample);
  let checked = 0;
  for (const t of tokens.split(/\r?\n/)) {
    const m = /^(\d+):(\d+) (\w+)(?: (.*))?$/.exec(t);
    if (!m || m[3] === "NEWLINE" || m[3] === "EOF") continue;
    const [, l, c, kind] = m;
    const line = +l - 1, col = charIndex(lines[line], +c - 1);
    if (inBlocks.has(`${line}:${col}`)) continue;
    const stack = scopes[line][col] || [];
    const leaf = stack[stack.length - 1] || "";
    const text = lines[line].slice(col);
    let ok, want;
    if (kind === "INT" || kind === "FLOAT") {
      want = "constant.numeric"; ok = leaf.startsWith("constant.numeric.");
    } else if (kind.startsWith("STRING")) {
      want = "string"; ok = stack.some((s) => s.startsWith("string."));
    } else if (kind === "FORMAT") {
      want = "constant.other.format-spec"; ok = leaf.startsWith("constant.other.format-spec");
    } else if (!["IDENT", "UNDERSCORE", "ERROR"].includes(kind) && /^[a-z]/.test(text)) {
      want = "a keyword"; ok = stack.some(isKeyword);
    } else {
      want = "code"; ok = !inString(stack) && !stack.some((s) => s.startsWith("comment."));
    }
    checked++;
    if (!ok) problems.push(`sample.plum:${l}:${c} ${kind} ${m[4] || ""}: want ${want}, got [${stack.join(" ")}]`);
  }

  // 3. Comments, and `#` in strings.
  const commentAt = ([l, c]) => (scopes[l][c] || []).some((s) => s.startsWith("comment."));
  for (const key of inBlocks) {
    const [l, c] = key.split(":").map(Number);
    if (!(scopes[l][c] || []).includes("comment.block.plum"))
      problems.push(`sample.plum:${l + 1}:${c + 1}: should be in a block comment`);
  }
  for (const [l, c] of comments) {
    if (lines[l].startsWith("##", c) && !lines[l].startsWith("###", c) &&
        !(scopes[l][c] || []).includes("comment.line.documentation.plum"))
      problems.push(`sample.plum:${l + 1}:${c + 1}: '##' should start a doc comment`);
  }
  for (const at of comments)
    if (!commentAt(at)) problems.push(`sample.plum:${at[0] + 1}:${at[1] + 1}: '#' should start a comment`);
  for (const at of inStrings)
    if (commentAt(at)) problems.push(`sample.plum:${at[0] + 1}:${at[1] + 1}: '#' in a string is highlighted as a comment`);

  for (const p of problems) console.log(p);
  console.log(`${keywords.length} keywords, ${checked} tokens and ${comments.length} comments (${inBlocks.size} characters of block comments) and ${inStrings.length} '#' in strings checked: ${problems.length} problems`);
  process.exitCode = problems.length ? 1 : 0;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
