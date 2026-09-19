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
- A quiz mode that reads questions out loud, waits for you, and only then
  reveals the answer.

## Quiz mode

Switch to **Quiz** above the text box to turn the app into a spoken flashcard
test. You write the questions and answers once, and from then on:

1. A question is read out loud and playback stops.
2. You answer from memory, out loud or in your head.
3. Press **Show answer** on that card — the answer is unblurred and read back
   to you.
4. It moves on to the next question automatically.

Cards never disappear: the ones you already answered stay on screen with the
answer visible, so you can look back over them at any point. When the run
ends you can repeat it, or add and remove questions.

Questions are shuffled on every run, so you memorise the answers instead of
the order. Everything is stored in your browser, nothing is uploaded.

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

There is a second suite that drives the quiz interface on a simulated DOM —
creating questions, confirming each card, checking that the answer is only
revealed after you confirm. It needs jsdom:

```
npm install
node tests/quiz-view.test.mjs
```

## Open source

Text Reader is free software under the [MIT license](LICENSE). Anyone can use
it, study it, change it and share it, for any purpose, including commercial
use. Fork it, strip out what you don't need, rename it, ship it — no
permission needed and no attribution required beyond keeping the license
notice.

It has no backend, no analytics and no ads. Your text stays in your browser
and is never sent anywhere; the only network requests are the one-time
downloads of the voice models.

Contributions are welcome: open an issue or a pull request on
[GitHub](https://github.com/X-PunPun/Text-reader).

## Notes

Downloadable voices need a secure context (`localhost` or HTTPS) and a
Chromium-based browser. The first time you pick one, its model is downloaded
and stored on your device; after that it works without a connection.
