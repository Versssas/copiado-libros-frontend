import { useState } from 'react'
import axios from 'axios'

const API = 'https://copiado-libros-backend-production.up.railway.app'
const getConfig = () => ({
    headers: { authorization: localStorage.getItem('token') }
})

function Trabajos({ trabajos, clientes, recargar }) {
  const [form, setForm] = useState({
    cliente_id: '',
    nro_factura: '',
    fecha: '',
    fecha_entrega: '',
    hojas: '',
    precio_hoja: localStorage.getItem('ultimo_precio') || '',
    estado: 'Pendiente',
    iva: false
  })
  const [editando, setEditando] = useState(null)
  const [formEditar, setFormEditar] = useState({
    cliente_id: '',
    nro_factura: '',
    fecha: '',
    fecha_entrega: '',
    hojas: '',
    precio_hoja: '',
    estado: '',
    iva: false
  })
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState({ campo: 'id', direccion: 'asc' })
  const [filtroEstado, setFiltroEstado] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const ordenar = (campo) => {
    setOrden(prev => ({
        campo,
        direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }))
  }

  const agregarTrabajo = async () => {
    if (!form.cliente_id || !form.fecha || !form.fecha_entrega || !form.hojas || !form.precio_hoja) {
      alert('Completá todos los campos')
      return
    }
    const total = form.hojas * form.precio_hoja
    const total_con_iva = form.iva ? total * 1.21 : null
    try {
      await axios.post(`${API}/trabajos/`, { ...form, total, total_con_iva }, getConfig())
      localStorage.setItem('ultimo_precio', form.precio_hoja)
      setForm({ cliente_id: '', nro_factura: '', fecha: '', fecha_entrega: '', hojas: '', precio_hoja: localStorage.getItem('ultimo_precio') || '', estado: 'Pendiente', iva: false })
      recargar()
    } catch (error) {
      alert(error.response?.data?.error || 'Error al guardar el trabajo')
    }
  }

  const eliminarTrabajo = async (id) => {
    if (!confirm('¿Seguro que querés eliminar este trabajo?')) return
    await axios.delete(`${API}/trabajos/${id}`, getConfig())
    recargar()
  }

  const formatearFecha = (fecha) => {
    const [year, month, day] = fecha.split('T')[0].split('-')
    return `${day}/${month}/${year}`
  }

  const formatearDinero = (monto) => {
    return '$' + Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const empezarEdicion = (trabajo) => {
    setEditando(trabajo.id)
    setFormEditar({
      cliente_id: trabajo.cliente_id,
      nro_factura: trabajo.nro_factura || '',
      fecha: trabajo.fecha.split('T')[0],
      fecha_entrega: trabajo.fecha_entrega.split('T')[0],
      hojas: trabajo.hojas,
      precio_hoja: trabajo.precio_hoja,
      estado: trabajo.estado,
      iva: trabajo.iva || false
    })
  }

  const guardarEdicion = async () => {
    const total = formEditar.hojas * formEditar.precio_hoja
    const total_con_iva = formEditar.iva ? total * 1.21 : null
    await axios.put(`${API}/trabajos/${editando}`, { ...formEditar, total, total_con_iva }, getConfig())
    setEditando(null)
    recargar()
  }

  const handleChangeEditar = (e) => {
    setFormEditar({ ...formEditar, [e.target.name]: e.target.value })
  }

  const trabajosFiltrados = trabajos
    .filter(t =>
      (t.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (t.nro_factura && t.nro_factura.toLowerCase().includes(busqueda.toLowerCase()))) &&
      (filtroEstado === '' || t.estado === filtroEstado)
    )
    .sort((a, b) => {
      let valA = a[orden.campo]
      let valB = b[orden.campo]
      if (orden.campo === 'fecha' || orden.campo === 'fecha_entrega') {
        valA = new Date(a[orden.campo])
        valB = new Date(b[orden.campo])
      }
      if (orden.campo === 'total' || orden.campo === 'precio_hoja' || orden.campo === 'hojas') {
        valA = Number(a[orden.campo])
        valB = Number(b[orden.campo])
      }
      if (orden.campo === 'cliente_nombre') {
        valA = a.cliente_nombre
        valB = b.cliente_nombre
      }
      if (valA < valB) return orden.direccion === 'asc' ? -1 : 1
      if (valA > valB) return orden.direccion === 'asc' ? 1 : -1
      return 0
    })

  return (
    <div>
      <h2>Trabajos</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Buscar por cliente o nro. factura..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: '300px' }}
        />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option>Pendiente</option>
          <option>En proceso</option>
          <option>Entregado</option>
          <option>Cobrado</option>
        </select>
      </div>

      <div className="form-card">
        <div className="form-row">
          <select name="cliente_id" value={form.cliente_id} onChange={handleChange}>
            <option value="">Seleccionar cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <input type="text" name="nro_factura" placeholder="Nro. Factura" value={form.nro_factura} onChange={handleChange} style={{width: '100px'}} />
          <input type="date" name="fecha" value={form.fecha} onChange={handleChange} />
          <input type="date" name="fecha_entrega" value={form.fecha_entrega} onChange={handleChange} />
          <input type="number" name="hojas" placeholder="Hojas" value={form.hojas} onChange={handleChange} />
          <input type="number" name="precio_hoja" placeholder="Precio por hoja" value={form.precio_hoja} onChange={handleChange} />
          <select name="estado" value={form.estado} onChange={handleChange}>
            <option>Pendiente</option>
            <option>En proceso</option>
            <option>Entregado</option>
            <option>Cobrado</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={form.iva === true}
              onChange={e => setForm({ ...form, iva: e.target.checked })}
            />
            IVA 21%
          </label>
        </div>
        <button type="button" className="agregar" onClick={agregarTrabajo}>Agregar</button>
      </div>
    
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Nro. Factura</th>
            <th onClick={() => ordenar('cliente_nombre')} style={{ cursor: 'pointer' }}>
              Cliente {orden.campo === 'cliente_nombre' ? (orden.direccion === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th onClick={() => ordenar('fecha')} style={{ cursor: 'pointer' }}>
              Fecha {orden.campo === 'fecha' ? (orden.direccion === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th onClick={() => ordenar('fecha_entrega')} style={{ cursor: 'pointer' }}>
              F. Entrega {orden.campo === 'fecha_entrega' ? (orden.direccion === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th onClick={() => ordenar('hojas')} style={{ cursor: 'pointer' }}>
              Hojas {orden.campo === 'hojas' ? (orden.direccion === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th>Precio</th>
            <th>IVA</th>
            <th onClick={() => ordenar('total')} style={{ cursor: 'pointer' }}>
              Total {orden.campo === 'total' ? (orden.direccion === 'asc' ? '↑' : '↓') : '↕'}
            </th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {trabajosFiltrados.map(t => (
            <tr key={t.id}>
              {editando === t.id ? (
                <>
                  <td><input type="text" name="nro_factura" value={formEditar.nro_factura} onChange={handleChangeEditar} style={{width:'80px'}} /></td>
                  <td>
                    <select name="cliente_id" value={formEditar.cliente_id} onChange={handleChangeEditar}>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td><input type="date" name="fecha" value={formEditar.fecha} onChange={handleChangeEditar} /></td>
                  <td><input type="date" name="fecha_entrega" value={formEditar.fecha_entrega} onChange={handleChangeEditar} /></td>
                  <td><input type="number" name="hojas" value={formEditar.hojas} onChange={handleChangeEditar} style={{width:'60px'}} /></td>
                  <td><input type="number" name="precio_hoja" value={formEditar.precio_hoja} onChange={handleChangeEditar} style={{width:'80px'}} /></td>
                  <td>
                    <label style={{
                      background: formEditar.iva ? '#27ae60' : '#ddd',
                      color: formEditar.iva ? 'white' : '#666',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <input
                        type="checkbox"
                        checked={formEditar.iva === true}
                        onChange={e => setFormEditar({ ...formEditar, iva: e.target.checked })}
                        style={{ margin: 0 }}
                      />
                      IVA
                    </label>
                  </td>
                  <td>{formEditar.iva ? formatearDinero(formEditar.hojas * formEditar.precio_hoja * 1.21) : formatearDinero(formEditar.hojas * formEditar.precio_hoja)}</td>
                  <td>
                    <select name="estado" value={formEditar.estado} onChange={handleChangeEditar}>
                      <option>Pendiente</option>
                      <option>En proceso</option>
                      <option>Entregado</option>
                      <option>Cobrado</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" className="agregar" onClick={guardarEdicion}>Guardar</button>
                    <button type="button" className="eliminar" onClick={() => setEditando(null)}>Cancelar</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{t.nro_factura || '-'}</td>
                  <td>{t.cliente_nombre}</td>
                  <td>{formatearFecha(t.fecha)}</td>
                  <td>{formatearFecha(t.fecha_entrega)}</td>
                  <td>{t.hojas}</td>
                  <td>{formatearDinero(t.precio_hoja)}</td>
                  <td>
                    <span style={{
                      background: t.iva ? '#27ae60' : '#ddd',
                      color: t.iva ? 'white' : '#666',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {t.iva ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td>{t.iva && t.total_con_iva ? formatearDinero(t.total_con_iva) : formatearDinero(t.total)}</td>
                  <td style={{
                    textDecoration: t.estado === 'Cobrado' ? 'line-through' : 'none',
                    color: t.estado === 'Cobrado' ? 'var(--color-text-tertiary, #aaa)' : 'inherit'
                  }}>
                    {t.estado}
                  </td>
                  <td>
                    <button type="button" className="editar" onClick={() => empezarEdicion(t)}>Editar</button>
                    <button type="button" className="eliminar" onClick={() => eliminarTrabajo(t.id)}>Eliminar</button>
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

export default Trabajos