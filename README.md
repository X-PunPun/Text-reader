# Text Reader

A single-page web app that reads any text out loud. No account, no
subscription, no character limit — everything runs in the browser.

**[Try it here](https://x-punpun.github.io/Text-reader/)**

## What it does

- Reads your text aloud and highlights the sentence and the exact word being
  spoken.
- Pause and click anywhere in the text to continue from that word.
- Playback speed in fixed steps, from 0.25x to 2.5x.
- Saves the whole reading as a file: MP3 at three bitrates, or WAV at
  16 and 24 bits.
- Three voice engines: your operating system's voices, and two sets of
  neural voices that download once and then work offline.
- Light and dark themes, an interface in 10 languages, and a side panel
  explaining how it works.

## Running it locally

The project uses ES modules, which browsers block when you open
`index.html` directly from disk. It has to be served over HTTP:

```
scripts\serve.bat
```

That starts a server on `http://localhost:8080` and opens your browser. It
uses Python if available, otherwise Node. Any static server works just as
well, for example:

```
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Language pages

`index.html` and the `en/ es/ pt/ ...` folders are **generated**, not edited by
hand. The template is `scripts/page.template.html`; after changing it, run:

```
node scripts/build-pages.mjs
```

That rewrites every language page, `sitemap.xml` and `robots.txt`. The page
texts used for search results live in `scripts/seo-content.mjs`.

## Tests

The core has no browser dependencies, so it runs under Node:

```
node tests/reader.test.mjs
```

## Notes

Downloadable voices need a secure context (`localhost` or HTTPS) and a
Chromium-based browser. The first time you pick one, its model is downloaded
and stored on your device; after that it works without a connection.
