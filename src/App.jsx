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
      console.error(error)
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
        <h1>Copiado de Libros Pergamino</h1>
        <div>
          <button onClick={() => setPagina('trabajos')}>Trabajos</button>
          <button onClick={() => setPagina('clientes')}>Clientes</button>
          <button onClick={() => setPagina('estadisticas')}>Estadísticas</button>
          <button onClick={exportarBackup}>💾 Backup</button>
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
        {pagina === 'trabajos' && <Trabajos trabajos={trabajos} clientes={clientes} recargar={cargarDatos} />}
        {pagina === 'clientes' && <Clientes clientes={clientes} recargar={cargarDatos} />}
        {pagina === 'estadisticas' && <Estadisticas trabajos={trabajos} />}
      </main>
    </div>
  )
}

export default App