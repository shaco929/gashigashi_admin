import React, { useState, useEffect } from 'react'
import { supabaseAdmin as supabase } from './supabase'

function App() {
  const [view, setView] = useState('home')
  const [requests, setRequests] = useState([])
  const [rentals, setRentals] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // 申請中 (pending) のデータを取得
    const { data: reqData, error: reqError } = await supabase
      .from('rental_requests')
      .select('*, pcs(pc_number)')
      .eq('status', 'pending')
      .order('start_time') // 開始順に並べる
    
    if (reqError) console.error('Error fetching requests:', reqError)
    if (reqData) setRequests(reqData)

    // 貸出中 (checked_out) のデータを取得
    const { data: rentData, error: rentError } = await supabase
      .from('rental_requests')
      .select('*, pcs(pc_number)')
      .eq('status', 'checked_out')
      .order('end_time') // 返却期限順に並べる

    if (rentError) console.error('Error fetching rentals:', rentError)
    if (rentData) setRentals(rentData)
  }

  // 期限切れ判定
  const isOverdue = (endTime) => {
    if (!endTime) return false
    const today = new Date()
    const targetDate = new Date(endTime)
    return today > targetDate
  }

  // 日付フォーマット (例: 1/13 10:00)
  const formatDate = (dateString) => {
    if (!dateString) return '---'
    const d = new Date(dateString)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const handleApprove = async (id) => {
    if (!confirm("承認しますか？")) return
    await supabase.from('rental_requests').update({ status: 'checked_out', checked_out_at: new Date() }).eq('id', id)
    fetchData()
  }

  const handleDeny = async (id) => {
    if (!confirm("否認（削除）しますか？")) return
    await supabase.from('rental_requests').delete().eq('id', id)
    fetchData()
  }

  const handleReturn = async (id) => {
    if (!confirm("返却済みにしますか？")) return
    await supabase.from('rental_requests').update({ status: 'returned', returned_at: new Date() }).eq('id', id)
    fetchData()
  }

  // --- レイアウト設定 ---
  const gridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '30px',
    justifyContent: 'flex-start',
    width: '100%',
    paddingBottom: '50px'
  }

  const cardStyle = {
    width: '320px',
    flexShrink: 0,
    border: '1px solid #000',
    borderRadius: '4px',
    padding: '25px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '280px',
    backgroundColor: '#fff',
    boxShadow: '2px 2px 5px rgba(0,0,0,0.1)'
  }

  // === 1. ホーム画面 ===
  if (view === 'home') {
    return (
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ position: 'absolute', top: 20, left: 20, fontSize: '1rem', border: '1px solid #000', padding: '10px 20px', margin: 0 }}>
          ホーム画面
        </h1>
        <div style={{ display: 'flex', gap: '40px' }}>
          <button onClick={() => setView('requests')} style={{ width: '220px', height: '220px', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', cursor: 'pointer' }}>
            貸出申請
            <br />
            <span style={{ fontSize: '1rem' }}>({requests.length}件)</span>
          </button>
          <button onClick={() => setView('rentals')} style={{ width: '220px', height: '220px', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', cursor: 'pointer' }}>
            貸出中管理
            <br />
            <span style={{ fontSize: '1rem' }}>({rentals.length}件)</span>
          </button>
        </div>
      </div>
    )
  }

  // === 2. 申請一覧画面 ===
  if (view === 'requests') {
    return (
      <div style={{ textAlign: 'left', width: '100%' }}>
        <button onClick={() => setView('home')} style={{ marginBottom: '30px', padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}>
          ← ホームへ戻る
        </button>
        <h2 style={{ borderLeft: '5px solid #000', paddingLeft: '15px', marginBottom: '30px', fontSize: '2rem' }}>
          貸出申請一覧
        </h2>

        <div style={gridStyle}>
          {requests.length === 0 && <p style={{ fontSize: '1.2rem' }}>現在、申請はありません。</p>}

          {requests.map(r => (
            <div key={r.id} style={cardStyle}>
              <div>
                <h2 style={{ fontSize: '2.2rem', margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  {r.pcs?.pc_number || 'PC不明'}
                </h2>
                <p style={{ fontSize: '0.9rem', marginBottom: '10px', wordBreak: 'break-all' }}>申請者ID:<br/>{r.user_id}</p>

                <div style={{ fontSize: '1.1rem', lineHeight: '1.8rem', color: '#333', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                  <div>申請期間:</div>
                  {/* start_time に修正 */}
                  <div style={{ fontWeight: 'bold' }}>{formatDate(r.start_time)}</div>
                  <div style={{ textAlign: 'center', lineHeight: '1rem' }}>⬇</div>
                  {/* end_time に修正 */}
                  <div style={{ fontWeight: 'bold' }}>{formatDate(r.end_time)} (希望)</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginTop: '20px' }}>
                <button onClick={() => handleApprove(r.id)} style={{ flex: 1, padding: '10px', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#e6f7ff', border: '1px solid #1890ff' }}>承認</button>
                <button onClick={() => handleDeny(r.id)} style={{ flex: 1, padding: '10px', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#fff1f0', border: '1px solid #ff4d4f' }}>否認</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // === 3. 貸出中一覧画面 ===
  if (view === 'rentals') {
    return (
      <div style={{ textAlign: 'left', width: '100%' }}>
        <button onClick={() => setView('home')} style={{ marginBottom: '30px', padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}>
          ← ホームへ戻る
        </button>
        <h2 style={{ borderLeft: '5px solid #000', paddingLeft: '15px', marginBottom: '30px', fontSize: '2rem' }}>
          貸出中アイテム
        </h2>

        <div style={gridStyle}>
          {rentals.length === 0 && <p style={{ fontSize: '1.2rem' }}>現在、貸出中のPCはありません。</p>}

          {rentals.map(r => {
            // end_time で期限切れ判定
            const overdue = isOverdue(r.end_time)
            return (
              <div key={r.id} style={{
                ...cardStyle,
                borderColor: overdue ? '#ff4444' : '#000',
                borderWidth: overdue ? '2px' : '1px'
              }}>
                <div>
                  <h2 style={{ fontSize: '2.2rem', margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '10px', color: overdue ? '#ff4444' : '#000' }}>
                    {r.pcs?.pc_number || 'PC不明'}
                  </h2>
                  <p style={{ fontSize: '0.9rem', marginBottom: '10px', wordBreak: 'break-all' }}>利用者ID:<br/>{r.user_id}</p>

                  <div style={{ margin: '10px 0', padding: '10px', backgroundColor: overdue ? '#fff0f0' : '#f9f9f9', borderRadius: '5px' }}>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>返却期限</p>
                    <p style={{
                      fontSize: '1.4rem',
                      fontWeight: 'bold',
                      color: overdue ? '#ff4444' : '#000',
                      margin: '5px 0'
                    }}>
                      {/* end_time に修正 */}
                      {formatDate(r.end_time)}
                    </p>
                    {overdue && <p style={{ color: '#ff4444', fontWeight: 'bold', margin: 0 }}>⚠ 返却期限切れ</p>}
                  </div>
                </div>

                <button onClick={() => handleReturn(r.id)} style={{ width: '100%', padding: '15px', fontSize: '1.2rem', cursor: 'pointer', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}>
                  返却完了
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return <div>エラー</div>
}

export default App