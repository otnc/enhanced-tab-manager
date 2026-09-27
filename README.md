# Enhanced Tab Manager

**English** | [日本語](README.ja.md)

<div style="text-align: center;">
  <img src="public/icons/128x128.png" alt="Logo" style="display: block; width: auto; height: 128px; margin: 0 auto;">
</div>

## Supported Languages

| Stable  | Unstable (Beta) |
| ------- | --------------- |
| EN / JA | -               |

> For correction requests, visit [Issues](https://github.com/otnc/enhanced-tab-manager/issues).

## Key Features

- **Auto Grouping**: Automatically groups tabs based on URLs or custom patterns.
- **Save & Close**: Save memory by saving all current tabs and closing them instantly.
- **Restore**: Restore saved tabs anytime you need them.
- **Customization**: Ignore specific protocols, subdomains (www), or query parameters for cleaner grouping.
- **Privacy**: No tracking. All data is stored locally in your browser.

## Description

<strong>Take control of your browser tabs.</strong>

Enhanced Tab Manager automatically organizes your messy tabs into groups based on domain names or custom rules.

You can also "Save & Close" all open tabs to free up memory and restore them later from the popup list.

Ensuring fast performance without tracking your data.

We are open to feedback! Please feel free to open an issue on GitHub.

## Pattern Matching Rules

Patterns use a glob-style syntax. Wildcards can appear anywhere in a pattern and can be combined freely.

| Wildcard | Meaning                                     |
| :------- | :------------------------------------------ |
| `*`      | Any sequence of characters (including none) |
| `?`      | Any single character                        |

| Pattern             | Description                                                     | Match Example                             | No-Match Example                   |
| :------------------ | :-------------------------------------------------------------- | :---------------------------------------- | :--------------------------------- |
| `example.com`       | **Exact Match**<br>Matches the entire URL/Domain perfectly.     | `example.com`                             | `sub.example.com`<br>`example.org` |
| `*.example.com`     | **Subdomain Wildcard**<br>Matches subdomains only.              | `blog.example.com`                        | `example.com`<br>`notexample.com`  |
| `example.*`         | **TLD Wildcard**<br>Matches any Top Level Domain.               | `example.com`<br>`example.jp`             | `my-example.com`                   |
| `*keyword*`         | **Partial Match**<br>Matches anywhere in the string.            | `my-keyword.com`<br>`keyword.example.com` | (matches anywhere)                 |
| `shop?.example.com` | **Single Character Wildcard**<br>Matches exactly one character. | `shop1.example.com`                       | `shop12.example.com`               |

> [!Note]
> Before matching, URLs are normalized based on your settings (e.g., removing `https://`, `www.`, or query parameters).
>
> A pattern without wildcards requires an exact match. The old quoted exact-match syntax (`"exact.com"`) was removed in v1.1.0; stored patterns are migrated automatically on update.
>
> With the "Disable Wildcards" option enabled, `*` and `?` are treated as literal characters and patterns require an exact match.

## Download

- [Chrome Web Store](https://chromewebstore.google.com/detail/pjjabdbillaokbiighjgibfajkacfind)
- [GitHub Releases](https://github.com/otnc/enhanced-tab-manager/releases)

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, documentation workflow, and release process.

## Get Support

If you have any questions or found a bug, please open an issue on GitHub.
