import { useState } from 'react'
import Clientes from './components/Clientes'
import Trabajos from './components/Trabajos'
import './App.css'

function App() {
  const [pagina, setPagina] = useState('trabajos')

  return (
    <div className="app">
      <nav>
        <h1>Copiado de Libros Pergamino</h1>
        <div>
          <button onClick={() => setPagina('trabajos')}>Trabajos</button>
          <button onClick={() => setPagina('clientes')}>Clientes</button>
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