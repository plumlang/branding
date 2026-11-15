# plum.elixpo.com: default card

The site-wide Open Graph card. Copy `og/plum.elixpo/default.png` to the
website's `public/og-image.png`.

## Text

- eyebrow: Programming language
- headline: Easy to write, fast to run, safe by design.
- sub: A small, statically typed language. One binary for Linux, macOS and Windows.
- url: plum.elixpo.com

## Code

```plum
tree Greeter {
    name: str
    branch greet() -> str => "Hi, {self.name}!"
}

drop(Greeter("world").greet())
```
