# plumlang/plumlang: repository social preview

Upload `og/repos/plumlang.png` in the repository's Settings, under Social
preview.

## Text

- size: 1280x640
- eyebrow: github.com/plumlang
- headline: Plumlang
- sub: A small, fast, memory-safe programming language, written in C11.
- url: plum.elixpo.com

## Code

```plum
seed net.http

plant app = http.server()
app.get("/hi/:name", (req) =>
    http.text("Hi, {req.params["name"]}!"))
app.listen(8080)
```
