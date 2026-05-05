import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { logDatabaseStats } from './utils/analytics'

// アプリ起動時にDB統計をログ出力
logDatabaseStats().catch(err => console.error('Failed to log database stats:', err))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
