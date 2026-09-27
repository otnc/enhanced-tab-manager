# Contributing to Enhanced Tab Manager

**English** | [日本語](CONTRIBUTING.ja.md)

Thank you for your interest in improving Enhanced Tab Manager!

## Development Setup

```sh
npm install       # install dependencies
npm run dev       # watch build into dist/ while editing
npm run build     # build dist/ and package the Web Store zip
npm run typecheck # TypeScript type check
npm run lint      # ESLint
npm run format    # Prettier (write)
npm run check     # typecheck + lint + format:check
```

Load `dist/` as an unpacked extension via `chrome://extensions` (or `brave://extensions`) to test your changes.

## Project Structure

```
public/               # static files copied verbatim into dist/
  manifest.json       # MV3 manifest (version synced from package.json)
  _locales/           # chrome.i18n messages (en, ja)
  icons/              # extension icons
  popup/              # popup HTML/CSS
src/                  # TypeScript sources
  background.ts       # service worker: events, commands, migration
  group.ts            # pattern matching and tab grouping
  tab.ts              # save & close / restore
  window.ts           # normal-window detection (Brave crash workaround)
  migration.ts        # pattern syntax migration on update
  popup.ts            # popup UI
scripts/              # build helper scripts (version sync, packaging)
```

## Documentation Is Generated — Never Hand-Edit It

`README.md`, `README.ja.md`, `CONTRIBUTING.md`, and `CONTRIBUTING.ja.md` are built by [Kiritan](https://github.com/otnc/kiritan) from `README.base.md` and `CONTRIBUTING.base.md`. Editing a generated file directly gets silently overwritten by the next build.

Always edit the `*.base.md` file instead, then regenerate:

```sh
npm run docs:build   # regenerate every localized document
npm run docs:check   # report missing/stale/machine-translated content
```

## Commit Message Conventions

Follow the existing style: `feat:`, `fix:`, `docs:`, `chore:`, `ci:` prefixes, all in English.

## Pull Requests

Branch from `main` and open a pull request into `main`. Do not push directly to `main`. Make sure `npm run check` and `npm run docs:check` pass before requesting a review.

## Release Process

Releases are published by the manual "Build and Release" workflow (Actions tab → Run workflow). It can bump the version (package.json + manifest, committed back to the branch), builds and packages the extension, and creates a GitHub release with the Chrome zip when the package version is newer than the latest tag. The Chrome Web Store upload is done manually from the zip.

## Chrome Only

This extension targets Chrome (and Chromium-based browsers such as Brave) only. There are no plans to support Firefox, and no Firefox build tooling exists.
