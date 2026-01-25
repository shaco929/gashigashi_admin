import React, { useState } from 'react'
import { supabase } from './supabase'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // 成功するとApp.jsx側で自動的に画面が切り替わります
    } catch (error) {
      alert('ログイン失敗: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- スタイル定義 ---
  const containerStyle = {
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }

  const formStyle = {
    width: '320px',
    border: '1px solid #000',
    borderRadius: '4px',
    padding: '30px',
    backgroundColor: '#fff',
    boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
    textAlign: 'left'
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '20px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontSize: '1rem'
  }

  const buttonStyle = {
    width: '100%',
    padding: '15px',
    fontSize: '1.2rem',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: '30px', fontSize: '1.5rem' }}>管理者ログイン</h1>
      <form style={formStyle} onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
            placeholder="admin@example.com"
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
            placeholder="********"
          />
        </div>
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? '認証中...' : 'ログイン'}
        </button>
      </form>
    </div>
  )
}