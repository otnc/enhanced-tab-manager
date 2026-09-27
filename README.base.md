# Enhanced Tab Manager

<div style="text-align: center;">
  <img src="public/icons/128x128.png" alt="Logo" style="display: block; width: auto; height: 128px; margin: 0 auto;">
</div>

## Supported Languages

| Stable  | Unstable (Beta) |
| ------- | --------------- |
| EN / JA | -               |

> For correction requests, visit [Issues](https://github.com/otnc/enhanced-tab-manager/issues).

:::kiritan{locale=en}

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
:::

:::kiritan{locale=ja}

## 主な機能

- **自動グループ化**: URLやカスタムパターンに基づいてタブを自動的にグループ化します。
- **保存して閉じる**: 現在のタブをすべて保存して即座に閉じ、メモリを節約します。
- **復元**: 保存したタブはいつでもポップアップのリストから復元できます。
- **カスタマイズ**: プロトコルやサブドメイン (www)、クエリパラメータを無視して、きれいなグループ化ができます。
- **プライバシー**: トラッキングなし。データはすべてブラウザのローカルに保存されます。

## 説明

<strong>ブラウザのタブを、もっと自由に管理しよう。</strong>

Enhanced Tab Managerは、ドメイン名やカスタムルールに基づいて、散らばったタブを自動的にグループ化して整理します。

また、「すべてのタブを保存して閉じる」機能を使えば、メモリを解放しつつ、後でリストから簡単にタブを復元できます。

データの外部送信やトラッキングは一切行いません。

フィードバックはGitHubのIssuesで受け付けています。機能の要望があればお気軽にどうぞ！

## パターンマッチングの仕様

パターンはglob風の記法です。ワイルドカードは位置を問わず使え、自由に組み合わせられます。

| ワイルドカード | 意味            |
| :------------- | :-------------- |
| `*`            | 任意の0文字以上 |
| `?`            | 任意の1文字     |

| 記法                | 説明                                                             | 一致例                                    | 不一致例                           |
| :------------------ | :--------------------------------------------------------------- | :---------------------------------------- | :--------------------------------- |
| `example.com`       | **完全一致**<br>URL/ドメイン全体に完全一致します。               | `example.com`                             | `sub.example.com`<br>`example.org` |
| `*.example.com`     | **サブドメインワイルドカード**<br>サブドメインのみに一致します。 | `blog.example.com`                        | `example.com`<br>`notexample.com`  |
| `example.*`         | **TLDワイルドカード**<br>任意のTLDに一致します。                 | `example.com`<br>`example.jp`             | `my-example.com`                   |
| `*keyword*`         | **部分一致**<br>文字列のどこにあっても一致します。               | `my-keyword.com`<br>`keyword.example.com` | (どこにあっても一致)               |
| `shop?.example.com` | **1文字ワイルドカード**<br>ちょうど1文字に一致します。           | `shop1.example.com`                       | `shop12.example.com`               |

> [!Note]
> マッチングの前に、設定に基づいてURLの正規化(`https://`や`www.`の削除など)が行われます。
>
> ワイルドカードなしのパターンは完全一致になります。旧バージョンの引用符による完全一致記法(`"exact.com"`)はv1.1.0で廃止され、保存済みのパターンは更新時に自動変換されます。
>
> 「ワイルドカードを無効化」オプションを有効にすると、`*`と`?`は通常の文字として扱われ、完全一致での判定になります。

## ダウンロード

- [Chrome Web Store](https://chromewebstore.google.com/detail/pjjabdbillaokbiighjgibfajkacfind)
- [GitHub Releases](https://github.com/otnc/enhanced-tab-manager/releases)

## 開発

開発環境のセットアップ、ドキュメントのワークフロー、リリース手順は [CONTRIBUTING.ja.md](CONTRIBUTING.ja.md) を参照してください。

## サポート

質問やバグを見つけた場合は、GitHubでIssueを開いてください。
:::
