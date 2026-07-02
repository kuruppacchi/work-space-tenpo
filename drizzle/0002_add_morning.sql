-- モーニング店長だけ追加（既に初期データがある DB 用）
-- 0001_seed.sql 全体は再実行しないでください

INSERT INTO stores (id, name)
SELECT '11111111-1111-1111-1111-111111111108', 'モーニング'
WHERE NOT EXISTS (
  SELECT 1 FROM stores WHERE id = '11111111-1111-1111-1111-111111111108'
);

INSERT INTO app_users (id, email, display_name, global_role)
SELECT '22222222-2222-2222-2222-222222222208', 'morning@example.com', 'モーニング 店長', 'user'
WHERE NOT EXISTS (
  SELECT 1 FROM app_users WHERE id = '22222222-2222-2222-2222-222222222208'
);

INSERT INTO store_memberships (user_id, store_id, store_role)
SELECT '22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111108', 'manager'
WHERE NOT EXISTS (
  SELECT 1 FROM store_memberships
  WHERE user_id = '22222222-2222-2222-2222-222222222208'
);
