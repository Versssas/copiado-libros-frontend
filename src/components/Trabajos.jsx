import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:3000'

function Trabajos() {
  const [trabajos, setTrabajos] = useState([])
  const [clientes, setClientes] = useState([])
  const [form, setForm] = useState({
    cliente_id: '',
    fecha: '',
    fecha_entrega: '',
    hojas: '',
    precio_hoja: '',
    estado: 'Pendiente'
  })

  useEffect(() => {
    cargarTrabajos()
    cargarClientes()
  }, [])

  const cargarTrabajos = async () => {
    const res = await axios.get(`${API}/trabajos/`)
    setTrabajos(res.data)
  }

  const cargarClientes = async () => {
    const res = await axios.get(`${API}/clientes/`)
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
    await axios.post(`${API}/trabajos/`, { ...form, total })
    setForm({ cliente_id: '', fecha: '', fecha_entrega: '', hojas: '', precio_hoja: '', estado: 'Pendiente' })
    cargarTrabajos()
  }

  const eliminarTrabajo = async (id) => {
    if (!confirm('¿Seguro que querés eliminar este trabajo?')) return
    await axios.delete(`${API}/trabajos/${id}`)
    cargarTrabajos()
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString()
    }

const formatearDinero = (monto) => {
    return '$' + Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
const [editando, setEditando] = useState(null)
const [formEditar, setFormEditar] = useState({
    cliente_id: '',
    fecha: '',
    fecha_entrega: '',
    hojas: '',
    precio_hoja: '',
    estado: ''
})

const empezarEdicion = (trabajo) => {
    setEditando(trabajo.id)
    setFormEditar({
        cliente_id: trabajo.cliente_id,
        fecha: trabajo.fecha.split('T')[0],
        fecha_entrega: trabajo.fecha_entrega.split('T')[0],
        hojas: trabajo.hojas,
        precio_hoja: trabajo.precio_hoja,
        estado: trabajo.estado
    })
}

const guardarEdicion = async () => {
    const total = formEditar.hojas * formEditar.precio_hoja
    await axios.put(`${API}/trabajos/${editando}`, { ...formEditar, total })
    setEditando(null)
    cargarTrabajos()
}

const handleChangeEditar = (e) => {
    setFormEditar({ ...formEditar, [e.target.name]: e.target.value })
}

  return (
    <div>
      <h2>Trabajos</h2>

      <div className="form-card">
        <div className="form-row">
            <select name="cliente_id" value={form.cliente_id} onChange={handleChange}>
            <option value="">Seleccionar cliente</option>
            {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
            </select>
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
        </div>
        <button className="agregar" onClick={agregarTrabajo}>Agregar</button>
        </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>F. Entrega</th>
            <th>Hojas</th>
            <th>Precio</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    {trabajos.map(t => (
        <tr key={t.id}>
            {editando === t.id ? (
                <>
                    <td>{t.id}</td>
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
                    <td>{formatearDinero(formEditar.hojas * formEditar.precio_hoja)}</td>
                    <td>
                        <select name="estado" value={formEditar.estado} onChange={handleChangeEditar}>
                            <option>Pendiente</option>
                            <option>En proceso</option>
                            <option>Entregado</option>
                            <option>Cobrado</option>
                        </select>
                    </td>
                    <td>
                        <button className="agregar" onClick={guardarEdicion}>Guardar</button>
                        <button className="eliminar" onClick={() => setEditando(null)}>Cancelar</button>
                    </td>
                </>
            ) : (
                <>
                    <td>{t.id}</td>
                    <td>{t.cliente_nombre}</td>
                    <td>{formatearFecha(t.fecha)}</td>
                    <td>{formatearFecha(t.fecha_entrega)}</td>
                    <td>{t.hojas}</td>
                    <td>{formatearDinero(t.precio_hoja)}</td>
                    <td>{formatearDinero(t.total)}</td>
                    <td>{t.estado}</td>
                    <td>
                        <button className="agregar" onClick={() => empezarEdicion(t)}>Editar</button>
                        <button className="eliminar" onClick={() => eliminarTrabajo(t.id)}>Eliminar</button>
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