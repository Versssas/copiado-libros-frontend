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

function Clientes({ clientes, estudios, recargar, mostrarToast }) {
  const [nombre, setNombre] = useState('')
  const [cuit, setCuit] = useState('')
  const [telefono, setTelefono] = useState('')
  const [condicionIva, setCondicionIva] = useState(1)
  const [estudioId, setEstudioId] = useState('')
  const [editando, setEditando] = useState(null)
  const [formEditar, setFormEditar] = useState({ nombre: '', cuit: '', telefono: '', condicion_iva: 1, estudio_contable_id: '' })
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstudio, setFiltroEstudio] = useState('')
  const [orden, setOrden] = useState({ campo: 'nombre', direccion: 'asc' })
  const [mostrarEstudios, setMostrarEstudios] = useState(false)
  const [editandoEstudio, setEditandoEstudio] = useState(null)
  const [nombreEstudioEditado, setNombreEstudioEditado] = useState('')

  const ordenar = (campo) => {
    setOrden(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }))
  }

  const flechaOrden = (campo) => orden.campo === campo ? (orden.direccion === 'asc' ? '↑' : '↓') : '↕'

  const agregarEstudio = async () => {
    const nombreEstudio = prompt('Nombre del nuevo estudio contable:')
    if (!nombreEstudio || !nombreEstudio.trim()) return
    try {
      const { data } = await axios.post(`${API}/estudios/`, { nombre: nombreEstudio.trim() }, getConfig())
      await recargar()
      setEstudioId(data.id)
      mostrarToast('Estudio agregado correctamente')
    } catch (error) {
      mostrarToast(error.response?.data?.error || 'Error al agregar el estudio', 'error')
    }
  }

  const empezarEdicionEstudio = (estudio) => {
    setEditandoEstudio(estudio.id)
    setNombreEstudioEditado(estudio.nombre)
  }

  const guardarEdicionEstudio = async (id) => {
    if (!nombreEstudioEditado.trim()) {
      mostrarToast('El nombre del estudio no puede estar vacío', 'error')
      return
    }
    try {
      await axios.put(`${API}/estudios/${id}`, { nombre: nombreEstudioEditado.trim() }, getConfig())
      setEditandoEstudio(null)
      recargar()
      mostrarToast('Estudio actualizado correctamente')
    } catch (error) {
      mostrarToast(error.response?.data?.error || 'Error al actualizar el estudio', 'error')
    }
  }

  const eliminarEstudio = async (id) => {
    if (!confirm('¿Seguro que querés eliminar este estudio? Los clientes asociados quedarán sin estudio.')) return
    try {
      await axios.delete(`${API}/estudios/${id}`, getConfig())
      recargar()
      mostrarToast('Estudio eliminado')
    } catch (error) {
      mostrarToast(error.response?.data?.error || 'Error al eliminar el estudio', 'error')
    }
  }

  const cuitValido = (valor) => {
    const limpio = (valor || '').replace(/[-\s]/g, '')
    return !limpio || /^\d{11}$/.test(limpio)
  }

  const agregarCliente = async () => {
    if (!nombre) {
      mostrarToast('Completá el nombre', 'error')
      return
    }
    if (!cuitValido(cuit)) {
      mostrarToast('El CUIT debe tener 11 números', 'error')
      return
    }
    try {
      await axios.post(`${API}/clientes/`, { nombre, cuit, telefono, condicion_iva: condicionIva, estudio_contable_id: estudioId || null }, getConfig())
      setNombre('')
      setCuit('')
      setTelefono('')
      setCondicionIva(1)
      setEstudioId('')
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
      condicion_iva: cliente.condicion_iva || 1,
      estudio_contable_id: cliente.estudio_contable_id || ''
    })
  }

  const guardarEdicion = async () => {
    if (!cuitValido(formEditar.cuit)) {
      mostrarToast('El CUIT debe tener 11 números', 'error')
      return
    }
    await axios.put(`${API}/clientes/${editando}`, formEditar, getConfig())
    setEditando(null)
    recargar()
    mostrarToast('Cliente actualizado correctamente')
  }

  const handleChangeEditar = (e) => {
    setFormEditar({ ...formEditar, [e.target.name]: e.target.value })
  }

  const clientesFiltrados = clientes
    .filter(c => {
      const texto = busqueda.trim().toLowerCase()
      const pasaTexto = !texto || c.nombre.toLowerCase().includes(texto) || (c.cuit || '').includes(texto)
      const pasaEstudio = filtroEstudio === ''
        ? true
        : filtroEstudio === 'sin'
          ? !c.estudio_contable_id
          : c.estudio_contable_id === Number(filtroEstudio)
      return pasaTexto && pasaEstudio
    })
    .sort((a, b) => {
      let valA, valB
      if (orden.campo === 'estudio_contable_nombre') {
        valA = a.estudio_contable_nombre || ''
        valB = b.estudio_contable_nombre || ''
      } else if (orden.campo === 'condicion_iva') {
        valA = condicionesIva[a.condicion_iva] || ''
        valB = condicionesIva[b.condicion_iva] || ''
      } else {
        valA = a[orden.campo] || ''
        valB = b[orden.campo] || ''
      }
      const cmp = String(valA).localeCompare(String(valB), 'es', { numeric: true, sensitivity: 'base' })
      return orden.direccion === 'asc' ? cmp : -cmp
    })

  return (
    <div>
      <h2>Clientes</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o CUIT..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="buscador-trabajos"
        />
        <select value={filtroEstudio} onChange={e => setFiltroEstudio(e.target.value)}>
          <option value="">Todos los estudios</option>
          <option value="sin">Sin estudio contable</option>
          {estudios.map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
        <input placeholder="CUIT (opcional)" value={cuit} onChange={e => setCuit(e.target.value)} />
        <input placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} />
        <select value={condicionIva} onChange={e => setCondicionIva(Number(e.target.value))}>
          <option value={1}>Resp. Inscripto</option>
          <option value={4}>Exento</option>
          <option value={5}>Cons. Final</option>
          <option value={6}>Monotributo</option>
          <option value={13}>Monotrib. Social</option>
        </select>
        <select value={estudioId} onChange={e => setEstudioId(e.target.value)}>
          <option value="">Sin estudio contable</option>
          {estudios.map(e => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
        <button type="button" className="cancelar" onClick={agregarEstudio}>+ Estudio</button>
        <button type="button" className="cancelar" onClick={() => setMostrarEstudios(!mostrarEstudios)}>
          {mostrarEstudios ? 'Ocultar estudios' : 'Gestionar estudios'}
        </button>
        <button type="button" className="agregar" onClick={agregarCliente}>Agregar</button>
      </div>
      {mostrarEstudios && (
        <div className="form-card" style={{ marginBottom: '16px' }}>
          {estudios.length === 0 && <p style={{ color: '#888' }}>No hay estudios contables cargados.</p>}
          {estudios.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              {editandoEstudio === e.id ? (
                <>
                  <input
                    value={nombreEstudioEditado}
                    onChange={ev => setNombreEstudioEditado(ev.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="editar" onClick={() => guardarEdicionEstudio(e.id)}>Guardar</button>
                  <button type="button" className="eliminar" onClick={() => setEditandoEstudio(null)}>Cancelar</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }}>{e.nombre}</span>
                  <button type="button" className="editar" onClick={() => empezarEdicionEstudio(e)}>Editar</button>
                  <button type="button" className="eliminar" onClick={() => eliminarEstudio(e.id)}>Eliminar</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => ordenar('nombre')} style={{ cursor: 'pointer' }}>Nombre {flechaOrden('nombre')}</th>
              <th onClick={() => ordenar('estudio_contable_nombre')} style={{ cursor: 'pointer' }}>Estudio Contable {flechaOrden('estudio_contable_nombre')}</th>
              <th onClick={() => ordenar('cuit')} style={{ cursor: 'pointer' }}>CUIT {flechaOrden('cuit')}</th>
              <th onClick={() => ordenar('telefono')} style={{ cursor: 'pointer' }}>Teléfono {flechaOrden('telefono')}</th>
              <th onClick={() => ordenar('condicion_iva')} style={{ cursor: 'pointer' }}>Condición IVA {flechaOrden('condicion_iva')}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map(c => (
              <tr key={c.id}>
                {editando === c.id ? (
                  <>
                    <td><input name="nombre" value={formEditar.nombre} onChange={handleChangeEditar} /></td>
                    <td>
                      <select name="estudio_contable_id" value={formEditar.estudio_contable_id} onChange={handleChangeEditar}>
                        <option value="">Sin estudio contable</option>
                        {estudios.map(e => (
                          <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                      </select>
                    </td>
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
                    <td>{c.estudio_contable_nombre || '—'}</td>
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