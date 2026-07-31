# Geometry Finance Lab

Living Prototype — Release 0.1.0 Genesis.

## Purpose

A local-first research canvas organized around one question in three spaces:

1. **Context** — state the falsifiable question and working constraints.
2. **Focus** — record observations with a source and confidence level.
3. **Tools** — maintain a minimal test discipline and export the ledger.

## Run locally

Open `website/index.html` in a browser, or serve the directory:

```powershell
python -m http.server 8765 --directory website
```

Then browse to `http://127.0.0.1:8765`.

## Publish with GitHub Pages

The included `.github/workflows/pages.yml` deploys the `website/` directory on every push to `main`. In the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions** once. The public URL will be:

`https://brains4gains-lab.github.io/Geometry-Finance-lab/`

## Safety boundary

This release has no market-data connection, exchange integration, trade execution, recommendation engine, or transmission of user entries. Its state is held only in browser `localStorage` and can be exported or cleared by the user.
