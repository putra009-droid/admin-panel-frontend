// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// import './index.css' // Sesuaikan jika perlu
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // <-- Impor AuthProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* // <--- Bungkus dengan AuthProvider */}
        <App />
      </AuthProvider> {/* // <--- Penutup AuthProvider */}
    </BrowserRouter>
  </React.StrictMode>,
)