import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://copiado-libros-backend-production.up.railway.app'

const getConfig = () => ({
    headers: { authorization: localStorage.getItem('token') }
})

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [nombre, setNombre] = useState('')
  const [cuit, setCuit] = useState('')
  const [telefono, setTelefono] = useState('')
  const [editando, setEditando] = useState(null)
  const [formEditar, setFormEditar] = useState({ nombre: '', cuit: '', telefono: '' })

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    const res = await axios.get(`${API}/clientes/`, getConfig())
    setClientes(res.data)
  }

  const agregarCliente = async () => {
    if (!nombre || !cuit) {
      alert('Completá todos los campos')
      return
    }
    await axios.post(`${API}/clientes/`, { nombre, cuit, telefono }, getConfig())
    setNombre('')
    setCuit('')
    setTelefono('')
    cargarClientes()
  }

  const eliminarCliente = async (id) => {
    if (!confirm('¿Seguro que querés eliminar este cliente?')) return
    try {
      await axios.delete(`${API}/clientes/${id}`, getConfig())
      cargarClientes()
    } catch (error) {
      alert('No se puede eliminar un cliente con trabajos asociados')
    }
  }

  const empezarEdicion = (cliente) => {
    setEditando(cliente.id)
    setFormEditar({ nombre: cliente.nombre, cuit: cliente.cuit, telefono: cliente.telefono || '' })
  }

  const guardarEdicion = async () => {
    await axios.put(`${API}/clientes/${editando}`, formEditar, getConfig())
    setEditando(null)
    cargarClientes()
  }

  const handleChangeEditar = (e) => {
    setFormEditar({ ...formEditar, [e.target.name]: e.target.value })
  }

  return (
    <div>
      <h2>Clientes</h2>
      <div className="form-row">
        <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
        <input placeholder="CUIT" value={cuit} onChange={e => setCuit(e.target.value)} />
        <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
        <button type="button" className="agregar" onClick={agregarCliente}>Agregar</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>CUIT</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.id}>
              {editando === c.id ? (
                <>
                  <td>{c.id}</td>
                  <td><input name="nombre" value={formEditar.nombre} onChange={handleChangeEditar} /></td>
                  <td><input name="cuit" value={formEditar.cuit} onChange={handleChangeEditar} /></td>
                  <td><input name="telefono" value={formEditar.telefono} onChange={handleChangeEditar} /></td>
                  <td>
                    <button type="button" className="editar" onClick={guardarEdicion}>Guardar</button>
                    <button type="button" className="eliminar" onClick={() => setEditando(null)}>Cancelar</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td>{c.cuit}</td>
                  <td>{c.telefono}</td>
                  <td>
                    <button type="button" className="whatsapp" onClick={() => enviarWhatsApp(t)}>WhatsApp</button>
                    <button type="button" className="editar" onClick={() => empezarEdicion(c)}>Editar</button>
                    <button type="button" className="eliminar" onClick={() => eliminarCliente(c.id)}>Eliminar</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Clientes