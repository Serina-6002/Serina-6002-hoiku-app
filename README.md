# 保育メモ (hoiku-app)

保育士が30秒で子どもの様子を記録できるメモアプリです。

## 機能

- **ログイン**: 8桁パスワードで職員認証
- **子ども一覧**: 登録された子どもをカード表示
- **記録入力**: チェック項目（ごはん・おやつ・午睡・排便・機嫌）＋メモで即記録
- **出欠管理**: 出席/欠席/遅刻/早退の区分と理由入力
- **記録一覧**: 子どもごとの記録を新しい順に一覧表示、編集・削除対応
- **自動下書き保存**: 入力中のデータを自動的にローカル保存

## 技術スタック

- Next.js 16 (App Router, TypeScript, Turbopack)
- React 19.2
- Tailwind CSS v4
- Supabase (PostgreSQL)

## セットアップ

```bash
npm install
cp .env.local.example .env.local
# .env.local に Supabase の URL と Anon Key を設定
npm run dev
```

## テスト用アカウント

| 職員名 | パスワード |
| ------ | ---------- |
| 山田   | A3f9K2pQ   |
| 鈴木   | xY7mL8zR   |
