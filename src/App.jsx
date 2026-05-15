import { useState } from 'react'
import Clientes from './components/Clientes'
import Trabajos from './components/Trabajos'
import Login from './components/Login'
import './App.css'

function App() {
  const [pagina, setPagina] = useState('trabajos')
  const [logueado, setLogueado] = useState(() => {
    const token = localStorage.getItem('token')
    return !!token
  })

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

  return (
    <div className="app">
      <nav>
        <h1>Copiado de Libros Pergamino</h1>
        <div>
          <button onClick={() => setPagina('trabajos')}>Trabajos</button>
          <button onClick={() => setPagina('clientes')}>Clientes</button>
          <button onClick={handleLogout}>Salir</button>
        </div>
      </nav>

      <main>
        {pagina === 'trabajos' && <Trabajos />}
        {pagina === 'clientes' && <Clientes />}
      </main>
    </div>
  )
}

export default App