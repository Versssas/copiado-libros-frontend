import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://copiado-libros-backend-production.up.railway.app'
const getConfig = () => ({
    headers: { authorization: localStorage.getItem('token') }
})

function Trabajos() {
  const [trabajos, setTrabajos] = useState([])
  const [clientes, setClientes] = useState([])
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

  useEffect(() => {
    cargarTrabajos()
    cargarClientes()
  }, [])

  const cargarTrabajos = async () => {
    const res = await axios.get(`${API}/trabajos/`, getConfig())
    setTrabajos(res.data)
  }

  const cargarClientes = async () => {
    const res = await axios.get(`${API}/clientes/`, getConfig())
    setClientes(res.data)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const agregarTrabajo = async () => {
    if (!form.cliente_id || !form.fecha || !form.fecha_entrega || !form.hojas || !form.precio_hoja) {
      alert('Completá todos los campos')
      return
    }
    const total = form.hojas * form.precio_hoja
    const total_con_iva = form.iva ? total * 1.21 : null
    await axios.post(`${API}/trabajos/`, { ...form, total, total_con_iva }, getConfig())
    localStorage.setItem('ultimo_precio', form.precio_hoja)
    setForm({ cliente_id: '', nro_factura: '', fecha: '', fecha_entrega: '', hojas: '', precio_hoja: localStorage.getItem('ultimo_precio') || '', estado: 'Pendiente', iva: false })
    cargarTrabajos()
  }

  const eliminarTrabajo = async (id) => {
    if (!confirm('¿Seguro que querés eliminar este trabajo?')) return
    await axios.delete(`${API}/trabajos/${id}`, getConfig())
    cargarTrabajos()
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
    cargarTrabajos()
  }

  const handleChangeEditar = (e) => {
    setFormEditar({ ...formEditar, [e.target.name]: e.target.value })
  }

  const trabajosFiltrados = trabajos.filter(t =>
    t.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (t.nro_factura && t.nro_factura.toLowerCase().includes(busqueda.toLowerCase()))
  )

  const enviarWhatsApp = (trabajo) => {
    const mensaje = `Hola, su trabajo de ${trabajo.hojas} hojas está listo. Total: ${formatearDinero(trabajo.total)}. Necesitas factura A o B?`
    const telefono = trabajo.cliente_telefono?.replace(/\D/g, '')
    window.open(`https://wa.me/54${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  return (
    <div>
      <h2>Trabajos</h2>
      <input
        type="text"
        placeholder="Buscar por cliente o nro. factura..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{ marginBottom: '16px', width: '300px' }}
      />
      <div className="form-card">
        <div className="form-row">
          <select name="cliente_id" value={form.cliente_id} onChange={handleChange}>
            <option value="">Seleccionar cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <input
            type="text"
            name="nro_factura"
            placeholder="Nro. Factura"
            value={form.nro_factura}
            onChange={handleChange}
            style={{width: '100px'}}
          />
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

      <table>
        <thead>
          <tr>
            <th>Nro. Factura</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>F. Entrega</th>
            <th>Hojas</th>
            <th>Precio</th>
            <th>IVA</th>
            <th>Total</th>
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
                  <td>{t.estado}</td>
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
  )
}

export default Trabajos