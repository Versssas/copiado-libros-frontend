import { useState, useEffect } from 'react'
import axios from 'axios'
import Clientes from './components/Clientes'
import Trabajos from './components/Trabajos'
import Login from './components/Login'
import Estadisticas from './components/Estadisticas'
import './App.css'

const API = 'https://copiado-libros-backend-production.up.railway.app'
const getConfig = () => ({
    headers: { authorization: localStorage.getItem('token') }
})

function App() {
  const [pagina, setPagina] = useState('trabajos')
  const [logueado, setLogueado] = useState(() => {
    return !!localStorage.getItem('token')
  })
  const [modoOscuro, setModoOscuro] = useState(() => {
    return localStorage.getItem('modo_oscuro') === 'true'
  })
  const [trabajos, setTrabajos] = useState([])
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    document.body.classList.toggle('dark', modoOscuro)
  }, [modoOscuro])

  useEffect(() => {
    if (logueado) cargarDatos()
  }, [logueado])
  
  const [toast, setToast] = useState(null)

  const mostrarToast = (mensaje, tipo = 'success') => {
      setToast({ mensaje, tipo })
      setTimeout(() => setToast(null), 3000)
}
  const cargarDatos = async () => {
    setCargando(true)
    try {
        const [resTrabajos, resClientes] = await Promise.all([
            axios.get(`${API}/trabajos/`, getConfig()),
            axios.get(`${API}/clientes/`, getConfig())
        ])
        setTrabajos(resTrabajos.data)
        setClientes(resClientes.data)
    } catch (error) {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            setLogueado(false)
        } else {
            mostrarToast('No se pudo conectar con el servidor', 'error')
        }
    }
    setCargando(false)
  }

  const handleLogin = () => {
    setLogueado(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setLogueado(false)
  }

  if (!logueado) {
    return <Login onLogin={handleLogin} />
  }

  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Cargando...</p>
      </div>
    )
  }

  const exportarBackup = () => {
    const XLSX = require('xlsx')
    
    const wsTrabajos = XLSX.utils.json_to_sheet(trabajos)
    const wsClientes = XLSX.utils.json_to_sheet(clientes)
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes')
    XLSX.utils.book_append_sheet(wb, wsTrabajos, 'Trabajos')
    
    const fecha = new Date().toLocaleDateString('es-AR').replace(/\//g, '-')
    XLSX.writeFile(wb, `backup-copiado-libros-${fecha}.xlsx`)
}

  return (
    <div className="app">
        <nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg width="42" height="42" viewBox="0 0 100 100">
          <rect x="18" y="20" width="30" height="42" rx="2" fill="#fff" opacity="0.9"/>
          <rect x="52" y="20" width="30" height="42" rx="2" fill="#fff" opacity="0.7"/>
          <rect x="46" y="20" width="6" height="42" fill="#fff" opacity="0.5"/>
          <rect x="20" y="17" width="26" height="4" rx="1" fill="#ddd" opacity="0.6"/>
          <rect x="54" y="17" width="26" height="4" rx="1" fill="#ddd" opacity="0.6"/>
        </svg>
        <h1>Copiado de Libros Pergamino</h1>
      </div>
      <div className="nav-buttons">
        <button onClick={() => setPagina('trabajos')}>Trabajos</button>
        <button onClick={() => setPagina('clientes')}>Clientes</button>
        <button onClick={() => setPagina('estadisticas')}>Estadísticas</button>
        <button onClick={() => {
          const nuevo = !modoOscuro
          setModoOscuro(nuevo)
          localStorage.setItem('modo_oscuro', nuevo)
        }}>
          {modoOscuro ? '☀️' : '🌙'}
        </button>
        <button onClick={handleLogout}>Salir</button>
  </div>
</nav>

      <main>
        {pagina === 'trabajos' && <Trabajos trabajos={trabajos} clientes={clientes} recargar={cargarDatos} mostrarToast={mostrarToast} />}
{pagina === 'clientes' && <Clientes clientes={clientes} recargar={cargarDatos} mostrarToast={mostrarToast} />}{pagina === 'estadisticas' && <Estadisticas trabajos={trabajos} />}
      </main>

      <footer style={{
      padding: '12px 32px',
      textAlign: 'center',
      fontSize: '12px',
      color: 'var(--color-text-tertiary, #aaa)',
      borderTop: '1px solid var(--color-border-tertiary, #eee)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
      }}>
      <span>Copiado de Libros Pergamino © 2026</span>
      <button onClick={exportarBackup} style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-tertiary, #aaa)',
          cursor: 'pointer',
          fontSize: '12px'
      }}>
          💾 Backup
      </button>
  </footer>
      {toast && (
    <div className={`toast ${toast.tipo === 'error' ? 'error' : ''}`}>
        {toast.mensaje}
    </div>
)}
    </div>
  )
}

export default App