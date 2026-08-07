import { useState } from 'react'
import axios from 'axios'

const API = 'https://copiado-libros-backend-production.up.railway.app'
const getConfig = () => ({
    headers: { authorization: localStorage.getItem('token') }
})

function Clientes({ clientes, recargar, mostrarToast }) {
  const [nombre, setNombre] = useState('')
  const [cuit, setCuit] = useState('')
  const [telefono, setTelefono] = useState('')
  const [editando, setEditando] = useState(null)
  const [formEditar, setFormEditar] = useState({ nombre: '', cuit: '', telefono: '' })

  const agregarCliente = async () => {
    if (!nombre || !cuit) {
      mostrarToast('Completá todos los campos', 'error')
      return
    }
    try {
      await axios.post(`${API}/clientes/`, { nombre, cuit, telefono }, getConfig())
      setNombre('')
      setCuit('')
      setTelefono('')
      recargar()
      mostrarToast('Cliente agregado correctamente')
    } catch (error) {
      mostrarToast(error.response?.data?.error || 'Error al agregar cliente', 'error')
    }
  }

  const eliminarCliente = async (id) => {
    if (!confirm('¿Seguro que querés eliminar este cliente?')) return
    try {
      await axios.delete(`${API}/clientes/${id}`, getConfig())
      recargar()
      mostrarToast('Cliente eliminado')
    } catch (error) {
      mostrarToast('No se puede eliminar un cliente con trabajos asociados', 'error')
    }
  }

  const empezarEdicion = (cliente) => {
    setEditando(cliente.id)
    setFormEditar({ nombre: cliente.nombre, cuit: cliente.cuit, telefono: cliente.telefono || '' })
  }

  const guardarEdicion = async () => {
    await axios.put(`${API}/clientes/${editando}`, formEditar, getConfig())
    setEditando(null)
    recargar()
    mostrarToast('Cliente actualizado correctamente')
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
      <div className="table-container">
        <table>
          <thead>
            <tr>
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
                    <td>{c.nombre}</td>
                    <td>{c.cuit}</td>
                    <td>{c.telefono}</td>
                    <td>
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
    </div>
  )
}

export default Clientes