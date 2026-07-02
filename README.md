# 店舗改善ワークスペース

店舗ごとの改善活動（課題 → 原因 → 対策 → タスク）を管理する4ペイン型ワークスペース。

## 技術スタック

- Next.js 16 (App Router)
- Neon PostgreSQL + Drizzle ORM
- Neon Auth（招待制）
- Vercel

## セットアップ

### 1. Neon プロジェクト

1. [Neon Console](https://console.neon.tech) でプロジェクトを作成
2. **Neon Auth** を有効化
3. `DATABASE_URL`（Pooled）と `NEON_AUTH_BASE_URL` を取得

### 2. 環境変数

```bash
cp .env.example .env
```

`.env` を編集:

```env
DATABASE_URL="postgresql://..."
NEON_AUTH_BASE_URL="https://ep-xxx.neonauth.../neondb/auth"
NEON_AUTH_COOKIE_SECRET="openssl rand -base64 32 で生成"
```

### 3. DB マイグレーション & シード

```bash
npm install
npm run db:push    # または npm run db:migrate
npm run db:seed
```

### 4. 開発サーバー

```bash
npm run dev
```

## Vercel デプロイ

1. GitHub リポジトリを Vercel にインポート
2. 環境変数を設定:
   - `DATABASE_URL`
   - `NEON_AUTH_BASE_URL`
   - `NEON_AUTH_COOKIE_SECRET`
3. Neon Auth の Allowed Redirect URLs に Vercel の URL を追加
4. デプロイ後、`npm run db:push` と `npm run db:seed` を本番 DB に対して実行

## 初期ユーザー（シード）

| メール | ロール | 店舗 |
|--------|--------|------|
| nishida@example.com | admin | 全店舗 |
| wso@example.com | manager | WSO |
| momochi@example.com | manager | ももち浜 |
| ... | ... | ... |

Neon Auth から各メールアドレスを招待し、初回ログインで `app_users` と自動紐づけされます。

## 画面

- `/` — 4ペイン ワークスペース（デスクトップ）/ ステップ遷移（iPad・スマホ）
- `/stores/[storeId]/settings` — 担当者マスタ
- `/admin/users` — ユーザー管理（admin のみ）
- `/admin/stores` — 店舗・所属管理（admin のみ）
