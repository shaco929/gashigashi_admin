import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .envファイルを読み込む
dotenv.config();

// 環境変数の取得（Viteの変数名に対応）
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// もしanonキーが .env にない場合を考慮し、VITE_付きも探す
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// 接続チェック
if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ エラー: 環境変数が見つかりません。');
  console.error('現在の読み込み状況:');
  console.error('- URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.error('- ServiceKey:', serviceRoleKey ? 'OK' : 'MISSING');
  process.exit(1);
}

// 通常のクライアント（一般ユーザー用）
const supabase = createClient(supabaseUrl, anonKey || 'dummy-key-for-test');

// 【重要】セットアップ専用の特権クライアント（Service Role Key）
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// テスト用ユーザー設定
const generalUser = { email: 'katukatu@example.com', password: 'password123' };
const adminUser   = { email: 'masmas@example.com',   password: 'password123' };

async function setupUsers() {
  console.log('🔧 環境セットアップ: ユーザーの作成と権限設定を行っています...');

  // 1. 一般ユーザーの作成・取得
  const { data: userGen, error: errGen } = await supabaseAdmin.auth.signUp(generalUser);
  if (errGen && !errGen.message.includes('already registered')) {
    console.error('❌ 一般ユーザー作成エラー:', errGen);
    return null;
  }
  let genId = userGen.user?.id;
  if (!genId) {
    const { data } = await supabaseAdmin.auth.signInWithPassword(generalUser);
    genId = data.user.id;
  }

  // 2. 管理者ユーザーの作成・取得
  const { data: userAdm, error: errAdm } = await supabaseAdmin.auth.signUp(adminUser);
  if (errAdm && !errAdm.message.includes('already registered')) {
    console.error('❌ 管理者ユーザー作成エラー:', errAdm);
    return null;
  }
  let admId = userAdm.user?.id;
  if (!admId) {
    const { data } = await supabaseAdmin.auth.signInWithPassword(adminUser);
    admId = data.user.id;
  }

  // 3. 【最重要】管理者ユーザーの role を 'admin' に強制変更
  const { error: roleError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', admId);

  if (roleError) {
    console.error('❌ 権限付与失敗:', roleError);
    return null;
  }

  console.log('✅ セットアップ完了: Admin権限を付与しました');
  return { genId, admId };
}

async function runTest() {
  // まずユーザーと権限を整える
  const ids = await setupUsers();
  if (!ids) return;

  console.log('\n🚀 統合シナリオテストを開始します（新権限対応版）...\n');

  let pcModelId = null;
  let pcId = null;
  let requestId = null;

  // ==========================================
  // 1. [Admin] データ準備 (機種とPCを作成)
  // ==========================================
  console.log('👑 1. [Admin] PCマスタと実機データを準備中...');
  
  const { error: loginError } = await supabase.auth.signInWithPassword(adminUser);
  if (loginError) return console.error('ログイン失敗:', loginError);

  const { data: modelData, error: modelError } = await supabase
    .from('pc_models')
    .insert([{ model_name: `Test Model ${Date.now()}`, manufacturer: 'Test Maker' }])
    .select()
    .single();
  
  if (modelError) return console.error('❌ 機種作成失敗 (権限不足の可能性):', modelError.message);
  pcModelId = modelData.id;

  const { data: pcData, error: pcError } = await supabase
    .from('pcs')
    .insert([{ 
      model_id: pcModelId, 
      pc_number: `PC-${Date.now()}`, 
      status: 'available' 
    }])
    .select()
    .single();

  if (pcError) return console.error('❌ PC作成失敗:', pcError.message);
  pcId = pcData.id;
  console.log('✅ 準備完了: PCを作成しました (ID:', pcId, ')');
  
  await supabase.auth.signOut();

  // ==========================================
  // 2. [User] PC一覧の閲覧 (Select)
  // ==========================================
  console.log('\n👤 2. [User] PC一覧が見られるかテスト...');
  await supabase.auth.signInWithPassword(generalUser);

  const { data: viewData, error: viewError } = await supabase
    .from('pcs')
    .select('*, pc_models(model_name)')
    .eq('id', pcId);

  if (!viewError && viewData.length > 0) {
    console.log('✅ 成功: ユーザーはPC情報を閲覧できました');
    console.log('   機種名:', viewData[0].pc_models.model_name);
  } else {
    console.error('❌ 失敗: PCが見えません', viewError);
  }

  // ==========================================
  // 3. [User] レンタル申請の作成 (Insert)
  // ==========================================
  console.log('\n👤 3. [User] レンタル申請を作成します...');
  
  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 1);
  startTime.setHours(10, 0, 0, 0);
  
  const endTime = new Date(startTime);
  endTime.setHours(12, 0, 0, 0);

  const { data: reqData, error: reqError } = await supabase
    .from('rental_requests')
    .insert([{
      user_id: ids.genId,
      pc_id: pcId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    }])
    .select()
    .single();

  if (!reqError) {
    console.log('✅ 成功: 申請が作成されました Status:', reqData.status);
    requestId = reqData.id;
  } else {
    console.error('❌ 失敗: 申請できませんでした', reqError.message);
    return;
  }

  // ==========================================
  // 4. [User] 不正な更新の試行 (Update - Fail)
  // ==========================================
  console.log('\n👤 4. [User] 勝手に「承認(checked_out)」に書き換えようとしてみます...');
  
  const { error: hackError } = await supabase
    .from('rental_requests')
    .update({ status: 'checked_out' })
    .eq('id', requestId);

  if (hackError || (await checkStatus(requestId)) !== 'checked_out') {
    console.log('✅ 成功: 不正な書き換えはブロックされました (RLS動作OK)');
  } else {
    console.error('❌ 失敗: 一般ユーザーがステータスを変更できてしまいました');
  }

  await supabase.auth.signOut();

  // ==========================================
  // 5. [Admin] 申請の承認 (Update - Success)
  // ==========================================
  console.log('\n👑 5. [Admin] 管理者が申請を「承認(checked_out)」します...');
  await supabase.auth.signInWithPassword(adminUser);

  const { data: approveData, error: approveError } = await supabase
    .from('rental_requests')
    .update({ status: 'checked_out', checked_out_at: new Date() })
    .eq('id', requestId)
    .select()
    .single();

  if (!approveError && approveData.status === 'checked_out') {
    console.log('✅ 成功: 管理者はステータスを更新できました');
  } else {
    console.error('❌ 失敗: 管理者なのに更新できませんでした', approveError);
  }

  // ==========================================
  // 6. 後始末 (Delete)
  // ==========================================
  console.log('\n🧹 テストデータを削除しています...');
  
  await supabase.from('rental_requests').delete().eq('id', requestId);
  await supabase.from('pcs').delete().eq('id', pcId);
  await supabase.from('pc_models').delete().eq('id', pcModelId);
  
  console.log('✨ テスト完了');
}

async function checkStatus(reqId) {
  const { data } = await supabase.from('rental_requests').select('status').eq('id', reqId).single();
  return data ? data.status : null;
}

runTest();