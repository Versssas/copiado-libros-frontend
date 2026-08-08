import { useState } from 'react'
import axios from 'axios'

const API = 'https://copiado-libros-backend-production.up.railway.app'
const getConfig = () => ({
    headers: { authorization: localStorage.getItem('token') }
})

const condicionesIva = {
    1: 'Resp. Inscripto',
    4: 'Exento',
    5: 'Cons. Final',
    6: 'Monotributo',
    13: 'Monotrib. Social'
}

function Clientes({ clientes, recargar, mostrarToast }) {
  const [nombre, setNombre] = useState('')
  const [cuit, setCuit] = useState('')
  const [telefono, setTelefono] = useState('')
  const [condicionIva, setCondicionIva] = useState(1)
  const [editando, setEditando] = useState(null)
  const [formEditar, setFormEditar] = useState({ nombre: '', cuit: '', telefono: '', condicion_iva: 1 })

  const agregarCliente = async () => {
    if (!nombre || !cuit) {
      mostrarToast('Completá todos los campos', 'error')
      return
    }
    try {
      await axios.post(`${API}/clientes/`, { nombre, cuit, telefono, condicion_iva: condicionIva }, getConfig())
      setNombre('')
      setCuit('')
      setTelefono('')
      setCondicionIva(1)
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
    setFormEditar({ 
      nombre: cliente.nombre, 
      cuit: cliente.cuit, 
      telefono: cliente.telefono || '',
      condicion_iva: cliente.condicion_iva || 1
    })
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
        <select value={condicionIva} onChange={e => setCondicionIva(Number(e.target.value))}>
          <option value={1}>Resp. Inscripto</option>
          <option value={4}>Exento</option>
          <option value={5}>Cons. Final</option>
          <option value={6}>Monotributo</option>
          <option value={13}>Monotrib. Social</option>
        </select>
        <button type="button" className="agregar" onClick={agregarCliente}>Agregar</button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>CUIT</th>
              <th>Teléfono</th>
              <th>Condición IVA</th>
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
                      <select name="condicion_iva" value={formEditar.condicion_iva} onChange={handleChangeEditar}>
                        <option value={1}>Resp. Inscripto</option>
                        <option value={4}>Exento</option>
                        <option value={5}>Cons. Final</option>
                        <option value={6}>Monotributo</option>
                        <option value={13}>Monotrib. Social</option>
                      </select>
                    </td>
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
                    <td>{condicionesIva[c.condicion_iva] || 'Resp. Inscripto'}</td>
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