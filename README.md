# Enhanced Tab Manager

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

<details>
  <summary>English</summary>
  <strong>Take control of your browser tabs.</strong><br>
  Enhanced Tab Manager automatically organizes your messy tabs into groups based on domain names or custom rules.<br>
  You can also "Save & Close" all open tabs to free up memory and restore them later from the popup list.<br>
  Ensuring fast performance without tracking your data.<br>
  We are open to feedback! Please feel free to open an issue on GitHub.
</details>
<details>
  <summary>日本語</summary>
  <strong>ブラウザのタブを、もっと自由に管理しよう。</strong><br>
  Enhanced Tab Managerは、ドメイン名やカスタムルールに基づいて、散らばったタブを自動的にグループ化して整理します。<br>
  また、「すべてのタブを保存して閉じる」機能を使えば、メモリを解放しつつ、後でリストから簡単にタブを復元できます。<br>
  データの外部送信やトラッキングは一切行いません。<br>
  フィードバックはGithubのIssuesで受け付けています。機能の要望があればお気軽にどうぞ！
</details>

<div style="text-align: center;">
  <img src="icons/128x128.png" alt="Logo" style="display: block; width: auto; height: 128px; margin: 0 auto;">
</div>

## Pattern Matching Rules / パターンマッチングの仕様

Patterns use a glob-style syntax. Wildcards can appear anywhere in a pattern and can be combined freely.
パターンは glob 風の記法です。ワイルドカードは位置を問わず使え、自由に組み合わせられます。

| Wildcard / ワイルドカード | Meaning / 意味                                                |
| :------------------------ | :------------------------------------------------------------ |
| `*`                       | Any sequence of characters (including none) / 任意の0文字以上 |
| `?`                       | Any single character / 任意の1文字                            |

| Pattern / 記法      | Description / 説明                                                                     | Match Example / 一致例                    | No-Match / 不一致例                     |
| :------------------ | :------------------------------------------------------------------------------------- | :---------------------------------------- | :-------------------------------------- |
| `example.com`       | **Exact Match**<br>Matches the entire URL/Domain perfectly.<br>完全一致                | `example.com`                             | `sub.example.com`<br>`example.org`      |
| `*.example.com`     | **Subdomain Wildcard**<br>Matches subdomains only.<br>サブドメインのみ一致             | `blog.example.com`                        | `example.com`<br>`notexample.com`       |
| `example.*`         | **TLD Wildcard**<br>Matches any Top Level Domain.<br>TLDワイルドカード                 | `example.com`<br>`example.jp`             | `my-example.com`                        |
| `*keyword*`         | **Partial Match**<br>Matches anywhere in the string.<br>部分一致                       | `my-keyword.com`<br>`keyword.example.com` | (matches anywhere / どこにあっても一致) |
| `shop?.example.com` | **Single Character Wildcard**<br>Matches exactly one character.<br>1文字ワイルドカード | `shop1.example.com`                       | `shop12.example.com`                    |

> [!Note]
> Before matching, URLs are normalized based on your settings (e.g., removing `https://`, `www.`, or query parameters).
> マッチングの前に、設定に基づいてURLの正規化（`https://`や`www.`の削除など）が行われます。
>
> A pattern without wildcards requires an exact match. The old quoted exact-match syntax (`"exact.com"`) was removed in v1.1.0; stored patterns are migrated automatically on update.
> ワイルドカードなしのパターンは完全一致になります。旧バージョンの引用符による完全一致記法（`"exact.com"`）は v1.1.0 で廃止され、保存済みのパターンは更新時に自動変換されます。
>
> With the "Disable Wildcards" option enabled, `*` and `?` are treated as literal characters and patterns require an exact match.
> 「ワイルドカードを無効化」オプションを有効にすると、`*` と `?` は通常の文字として扱われ、完全一致での判定になります。

### Download

- ~~Chrome Webstore~~
- [GitHub Releases](https://github.com/otnc/enhanced-tab-manager/releases)

## Get Support

If you have any questions or found a bug, please open an issue on GitHub.
