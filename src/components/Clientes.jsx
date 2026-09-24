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
  const [carpetaAbierta, setCarpetaAbierta] = useState(null) // null = vista de carpetas; 'sin' o id de estudio

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

  const clientesDeCarpeta = clientes.filter(c =>
    carpetaAbierta === 'sin' ? !c.estudio_contable_id : c.estudio_contable_id === carpetaAbierta
  )

  const clientesFiltrados = clientesDeCarpeta.filter(c => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return true
    return c.nombre.toLowerCase().includes(texto) || (c.cuit || '').includes(texto)
  })

  const abrirCarpeta = (id) => {
    setCarpetaAbierta(id)
    setEstudioId(id === 'sin' ? '' : id)
    setBusqueda('')
  }

  const clientesSinEstudio = clientes.filter(c => !c.estudio_contable_id).length

  if (carpetaAbierta === null) {
    return (
      <div>
        <h2>Clientes por Estudio Contable</h2>
        <div className="carpetas-grid">
          {estudios.map(e => (
            <button key={e.id} type="button" className="carpeta" onClick={() => abrirCarpeta(e.id)}>
              <span className="carpeta-icono">📁</span>
              <span className="carpeta-nombre">{e.nombre}</span>
              <span className="carpeta-cantidad">
                {clientes.filter(c => c.estudio_contable_id === e.id).length} clientes
              </span>
            </button>
          ))}
          <button type="button" className="carpeta" onClick={() => abrirCarpeta('sin')}>
            <span className="carpeta-icono">📁</span>
            <span className="carpeta-nombre">Sin estudio contable</span>
            <span className="carpeta-cantidad">{clientesSinEstudio} clientes</span>
          </button>
          <button type="button" className="carpeta carpeta-nueva" onClick={agregarEstudio}>
            <span className="carpeta-icono">+</span>
            <span className="carpeta-nombre">Nuevo estudio</span>
          </button>
        </div>
      </div>
    )
  }

  const nombreCarpeta = carpetaAbierta === 'sin'
    ? 'Sin estudio contable'
    : estudios.find(e => e.id === carpetaAbierta)?.nombre || ''

  return (
    <div>
      <button type="button" className="cancelar" onClick={() => setCarpetaAbierta(null)} style={{ marginBottom: '16px' }}>
        ← Volver a estudios
      </button>
      <h2>{nombreCarpeta}</h2>
      <input
        type="text"
        placeholder="Buscar por nombre o CUIT..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="buscador-trabajos"
        style={{ marginBottom: '16px' }}
      />
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
            {clientesFiltrados.map(c => (
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
                      <select name="estudio_contable_id" value={formEditar.estudio_contable_id} onChange={handleChangeEditar} title="Mover a otro estudio">
                        <option value="">Sin estudio contable</option>
                        {estudios.map(e => (
                          <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                      </select>
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
                    <td>{c.estudio_contable_nombre || '—'}</td>
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