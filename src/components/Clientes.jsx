import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://copiado-libros-backend-production.up.railway.app'

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [nombre, setNombre] = useState('')
  const [cuit, setCuit] = useState('')

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    const res = await axios.get(`${API}/clientes/`)
    setClientes(res.data)
  }

  const agregarCliente = async () => {
    if (!nombre || !cuit) {
      alert('Completá todos los campos')
      return
    }
    await axios.post(`${API}/clientes/`, { nombre, cuit })
    setNombre('')
    setCuit('')
    cargarClientes()
  }

  const eliminarCliente = async (id) => {
    if (!confirm('¿Seguro que querés eliminar este cliente?')) return
    await axios.delete(`${API}/clientes/${id}`)
    cargarClientes()
  }

  return (
    <div>
      <h2>Clientes</h2>

      <div className="form-row">
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
        />
        <input
          placeholder="CUIT"
          value={cuit}
          onChange={e => setCuit(e.target.value)}
        />
        <button onClick={agregarCliente}>Agregar</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>CUIT</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.nombre}</td>
              <td>{c.cuit}</td>
              <td>
                <button onClick={() => eliminarCliente(c.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Clientes