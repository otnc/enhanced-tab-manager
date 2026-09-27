# Enhanced Tab Manager

[English](README.md) | **日本語**

<div style="text-align: center;">
  <img src="public/icons/128x128.png" alt="Logo" style="display: block; width: auto; height: 128px; margin: 0 auto;">
</div>

## Supported Languages

| Stable  | Unstable (Beta) |
| ------- | --------------- |
| EN / JA | -               |

> For correction requests, visit [Issues](https://github.com/otnc/enhanced-tab-manager/issues).

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
> マッチングの前に、設定に基づいてURLの正規化（`https://`や`www.`の削除など）が行われます。
>
> ワイルドカードなしのパターンは完全一致になります。旧バージョンの引用符による完全一致記法（`"exact.com"`）はv1.1.0で廃止され、保存済みのパターンは更新時に自動変換されます。
>
> 「ワイルドカードを無効化」オプションを有効にすると、`*`と`?`は通常の文字として扱われ、完全一致での判定になります。

## ダウンロード

- [Chrome Web Store](https://chromewebstore.google.com/detail/pjjabdbillaokbiighjgibfajkacfind)
- [GitHub Releases](https://github.com/otnc/enhanced-tab-manager/releases)

## 開発

開発環境のセットアップ、ドキュメントのワークフロー、リリース手順は [CONTRIBUTING.ja.md](CONTRIBUTING.ja.md) を参照してください。

## サポート

質問やバグを見つけた場合は、GitHubでIssueを開いてください。
