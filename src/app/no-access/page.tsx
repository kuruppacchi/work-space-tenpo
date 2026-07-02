export default function NoAccessPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">
          アクセス権がありません
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          このアカウントは店舗改善ワークスペースに登録されていません。
          管理者に招待を依頼してください。
        </p>
      </div>
    </main>
  );
}
