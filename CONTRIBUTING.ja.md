# Contributing to Enhanced Tab Manager

[English](CONTRIBUTING.md) | **日本語**

Enhanced Tab Managerの改善にご関心いただき、ありがとうございます！

## 開発環境のセットアップ

```sh
npm install       # 依存パッケージのインストール
npm run dev       # 編集中もdist/へウォッチビルド
npm run build     # dist/のビルドとWeb Store用zipの作成
npm run typecheck # TypeScriptの型チェック
npm run lint      # ESLint
npm run format    # Prettier(書き込み)
npm run check     # typecheck + lint + format:check
```

変更を試すには、`chrome://extensions`(または`brave://extensions`)で`dist/`を「パッケージ化されていない拡張機能」として読み込んでください。

## プロジェクト構成

```
public/               # dist/にそのままコピーされる静的ファイル
  manifest.json       # MV3マニフェスト(バージョンはpackage.jsonから同期)
  _locales/           # chrome.i18nメッセージ(en、ja)
  icons/              # 拡張機能のアイコン
  popup/              # ポップアップのHTML/CSS
src/                  # TypeScriptソース
  background.ts       # サービスワーカー: イベント、コマンド、マイグレーション
  group.ts            # パターンマッチングとタブのグループ化
  tab.ts              # 保存して閉じる / 復元
  window.ts           # 通常ウィンドウの判定(Braveクラッシュ回避)
  migration.ts        # 更新時のパターン記法マイグレーション
  popup.ts            # ポップアップUI
scripts/              # ビルド補助スクリプト(バージョン同期、パッケージ化)
```

## ドキュメントの編集ルール

`README.md`、`README.ja.md`、`CONTRIBUTING.md`、`CONTRIBUTING.ja.md`は[Kiritan](https://github.com/otnc/kiritan)によって`README.base.md`と`CONTRIBUTING.base.md`から生成されます。生成されたファイルを直接編集すると、次のビルドで黙って上書きされます。

代わりに必ず`*.base.md`ファイルを編集してから、再生成してください。

```sh
npm run docs:build   # ローカライズされたドキュメントをすべて再生成
npm run docs:check   # 未翻訳、古い翻訳、機械翻訳を報告
```

## コミットメッセージの規約

既存のスタイルに合わせて、`feat:`、`fix:`、`docs:`、`chore:`、`ci:`のプレフィックスを英語で付けてください。

## プルリクエスト

`main`からブランチを切り、`main`へのプルリクエストを開いてください。`main`に直接pushしないでください。レビュー依頼の前に`npm run check`と`npm run docs:check`が通ることを確認してください。

## リリース手順

リリースは手動実行の「Build and Release」ワークフローで行います(Actionsタブ → Run workflow)。バージョンの引き上げ(package.jsonとマニフェスト、ブランチにコミットバック)、拡張機能のビルドとパッケージ化を行い、パッケージのバージョンが最新タグより新しい場合にChrome用zip付きのGitHubリリースを作成します。Chrome Web Storeへのアップロードはzipから手動で行います。

## Chrome専用

この拡張機能はChrome(およびBraveなどのChromium系ブラウザ)のみを対象としています。Firefox対応の予定はなく、Firefox用のビルドツールもありません。
