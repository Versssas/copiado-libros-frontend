import { useState } from 'react'
import Clientes from './components/Clientes'
import Trabajos from './components/Trabajos'
import Login from './components/Login'
import './App.css'
import Estadisticas from './components/Estadisticas'
function App() {
  const [pagina, setPagina] = useState('trabajos')
  const [modoOscuro, setModoOscuro] = useState(() => {
   return localStorage.getItem('modo_oscuro') === 'true'
  })

  useEffect(() => {
    document.body.classList.toggle('dark', modoOscuro)
  }, [modoOscuro])

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
    <div className="app ${modoOscuro ? 'dark' : ''}">
      <nav>
        <h1>Copiado de Libros Pergamino</h1>
        <div>
          <button onClick={() => {
              const nuevo = !modoOscuro
              setModoOscuro(nuevo)
              localStorage.setItem('modo_oscuro', nuevo)
          }}>
              {modoOscuro ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setPagina('trabajos')}>Trabajos</button>
          <button onClick={() => setPagina('clientes')}>Clientes</button>
          <button onClick={() => setPagina('estadisticas')}>Estadísticas</button>
          <button onClick={handleLogout}>Salir</button>
        </div>
      </nav>

      <main>
        {pagina === 'trabajos' && <Trabajos />}
        {pagina === 'clientes' && <Clientes />}
        {pagina === 'estadisticas' && <Estadisticas />}
      </main>
    </div>
  )
}

export default App