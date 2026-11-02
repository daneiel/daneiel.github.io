# daneiel.github.io

[Português](README.md) · **English** · [中文](README.zh-CN.md) · [Русский](README.ru.md)

Daniel Souza's personal site, published with GitHub Pages at **https://daneiel.github.io/**. Static HTML, CSS and JavaScript, no build step.

## What's here

| Path | Page | Source |
| --- | --- | --- |
| [`index.html`](index.html) | [Portfolio](https://daneiel.github.io/): intro, projects, about, design tokens and contact | this repository |
| [`virapets/`](virapets/) | [ViraPets Studio](https://daneiel.github.io/virapets/): pixel-art mascot creator (procedural drawing, local photo to pixel art, and stickers), works offline | [viralabs-dev/virapets](https://github.com/viralabs-dev/virapets) · [guide](https://github.com/viralabs-dev/virapets/blob/main/site/README.md) |
| `/brabo/` | [Brabo documentation](https://daneiel.github.io/brabo/) | published by the [daneiel/brabo](https://github.com/daneiel/brabo) repository itself |

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/ and http://localhost:8000/virapets/
```

## Publishing

GitHub Pages serves the `main` branch from the root. A push to `main` publishes the site.

## License

ViraPets Studio is MIT licensed ([`virapets/LICENSE`](virapets/LICENSE)); notices for the ML libraries are in `virapets/vendor/`.
