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

### Explicit Rules

Select **Explicit Rules** as a group's matching target, then enter space-separated rules. Existing groups keep their current matching target and patterns until you edit them.

| Rule                     | Matches                                                                       |
| ------------------------ | ----------------------------------------------------------------------------- |
| `host:github.com`        | The hostname `github.com` on any path. Use `host:mail.*` for a hostname glob. |
| `domain:github.io`       | `github.io` and subdomains such as `otnc.github.io`.                          |
| `host:github.com/otnc/*` | Pages on `github.com` with a path starting with `/otnc/`.                     |
| `url:*keyword*`          | The URL after applying the protocol, WWW, query, and fragment options.        |
| `!host:gist.github.com`  | Excludes `gist.github.com` from this group, so later groups can match it.     |

A group needs at least one matching inclusion. A matching exclusion takes precedence anywhere in the group. Groups with an invalid rule are skipped, and the settings show which rule needs fixing. The first matching group in the list wins.

`host:` and `domain:` read the hostname directly, including any `www` label, and ignore the port, query, and fragment. Hostnames are case-insensitive. The optional path in `host:` is case-sensitive. The **Disable Wildcards** option applies to `host:` and `url:`.

For a GitHub group, try `domain:github.com domain:github.io domain:githubusercontent.com`. This matches `raw.githubusercontent.com` and skips Go Packages pages whose path contains `github.com`. Use **Test a URL** to check which group wins.

## Download

- [Chrome Web Store](https://chromewebstore.google.com/detail/pjjabdbillaokbiighjgibfajkacfind)
- [GitHub Releases](https://github.com/otnc/enhanced-tab-manager/releases)

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, documentation workflow, and release process.

## Get Support

If you have any questions or found a bug, please open an issue on GitHub.
