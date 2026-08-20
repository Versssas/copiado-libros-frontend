import { useState } from 'react'
import axios from 'axios'
import { createPortal } from 'react-dom'
import { generarFacturaPDF } from './FacturaPDF'

const API = 'https://copiado-libros-backend-production.up.railway.app'
const getConfig = () => ({
    headers: { authorization: localStorage.getItem('token') }
})

function Trabajos({ trabajos, clientes, recargar, mostrarToast }) {
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
  const [orden, setOrden] = useState({ campo: 'id', direccion: 'desc' })
  const [filtroEstado, setFiltroEstado] = useState('')
  const [previewFactura, setPreviewFactura] = useState(null)
  const [visibleCount, setVisibleCount] = useState(15)
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const ordenar = (campo) => {
    setOrden(prev => ({
        campo,
        direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }))
  }

  const [modalFactura, setModalFactura] = useState(null)

const emitirFactura = (id) => {
    const trabajo = trabajos.find(t => t.id === id)
    if (trabajo.nro_factura && !trabajo.anulada) {
        mostrarToast('Este trabajo ya tiene una factura vigente. Anulala con nota de crédito antes de generar una nueva.', 'error')
        return
    }
    setModalFactura(id)
}

const seleccionarTipoFactura = (tipo) => {
    const trabajo = trabajos.find(t => t.id === modalFactura)
    const total = trabajo.iva ? Number(trabajo.total_con_iva) : Number(trabajo.total)
    const neto = Number(trabajo.total)
    const iva = trabajo.iva ? total - neto : 0
    
    setPreviewFactura({
        trabajo_id: modalFactura,
        tipo,
        cliente: trabajo.cliente_nombre,
        cuit_cliente: trabajo.cliente_cuit || '',
        hojas: trabajo.hojas,
        precio_hoja: trabajo.precio_hoja,
        neto,
        iva,
        total,
        fecha: new Date().toLocaleDateString('es-AR')
    })
    setModalFactura(null)
}

const confirmarFactura = async () => {
    try {
        const res = await axios.post(`${API}/facturas/emitir`, {
            trabajo_id: previewFactura.trabajo_id,
            tipo_factura: previewFactura.tipo
        }, getConfig())

        await generarFacturaPDF({
            ...previewFactura,
            nro_comprobante: res.data.nro_comprobante,
            cae: res.data.cae,
            cae_vencimiento: res.data.vencimiento
        })

        setPreviewFactura(null)
        mostrarToast(`Factura emitida! CAE: ${res.data.cae}`)
        recargar()
    } catch (error) {
        mostrarToast(error.response?.data?.error || 'Error al emitir factura', 'error')
    }
}

  const [trabajoAAnular, setTrabajoAAnular] = useState(null)
  const [modalTipoAnular, setModalTipoAnular] = useState(null)

  const anularFactura = (trabajo) => {
    if (!trabajo.tipo_factura) {
        setModalTipoAnular(trabajo)
        return
    }
    setTrabajoAAnular(trabajo)
  }

  const seleccionarTipoAnular = (tipo) => {
    setTrabajoAAnular({ ...modalTipoAnular, tipo_factura: tipo })
    setModalTipoAnular(null)
  }

  const confirmarAnulacion = async () => {
    const trabajo = trabajoAAnular
    try {
        const res = await axios.post(`${API}/facturas/anular`, {
            trabajo_id: trabajo.id,
            tipo_factura_original: trabajo.tipo_factura
        }, getConfig())

        const tipoNC = trabajo.tipo_factura === 1 ? 3 : trabajo.tipo_factura === 6 ? 8 : 13
        const letraOriginal = trabajo.tipo_factura === 1 ? 'A' : trabajo.tipo_factura === 6 ? 'B' : 'C'
        const total = trabajo.iva ? Number(trabajo.total_con_iva) : Number(trabajo.total)
        const neto = Number(trabajo.total)
        const iva = trabajo.iva ? total - neto : 0

        await generarFacturaPDF({
            tipo: tipoNC,
            nro_comprobante: res.data.nro_comprobante,
            fecha: new Date().toLocaleDateString('es-AR'),
            cliente: trabajo.cliente_nombre,
            cuit_cliente: trabajo.cliente_cuit || '',
            hojas: trabajo.hojas,
            precio_hoja: trabajo.precio_hoja,
            neto,
            iva,
            total,
            cae: res.data.cae,
            cae_vencimiento: res.data.vencimiento,
            tipoComprobante: 'NOTA DE CRÉDITO',
            comprobanteAsociado: `Comp. asociado: Factura ${letraOriginal} N° ${trabajo.nro_factura}`
        })

        setTrabajoAAnular(null)
        mostrarToast(`Factura anulada! Nota de crédito CAE: ${res.data.cae}`)
        recargar()
    } catch (error) {
        mostrarToast(error.response?.data?.error || 'Error al anular la factura', 'error')
    }
  }

  const agregarTrabajo = async () => {
    if (!form.cliente_id || !form.fecha || !form.fecha_entrega || !form.hojas || !form.precio_hoja) {
      mostrarToast('Completá todos los campos')
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
      mostrarToast(error.response?.data?.error || 'Error al guardar el trabajo')
    }
  }

  const eliminarTrabajo = async (id) => {
    if (!confirm('¿Seguro que querés eliminar este trabajo?')) return
    await axios.delete(`${API}/trabajos/${id}`, getConfig())
    recargar()
    mostrarToast('Trabajo eliminado')
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
    mostrarToast('Trabajo actualizado correctamente')
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

  const trabajosVisibles = trabajosFiltrados.slice(0, visibleCount)

  return (
    <div>
      <h2>Trabajos</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Buscar por cliente o nro. factura..."
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setVisibleCount(15) }}
          style={{ width: '300px' }}
        />
        <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setVisibleCount(15) }}>
          <option value="">Todos los estados</option>
          <option>Pendiente</option>
        
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
          <input type="number" name="precio_hoja" placeholder="Precio" value={form.precio_hoja} onChange={handleChange} />
          <select name="estado" value={form.estado} onChange={handleChange}>
            <option>Pendiente</option>
           
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
        <div style={{display : 'flex', justifyContent: 'fiex-end', marginTop: '12px' }}>
        <button type="button" className="agregar" onClick={agregarTrabajo}>Agregar</button>
      </div>
      </div>
    {editando && <div className="editing-overlay" onClick={() => setEditando(null)} />}
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
          {trabajosVisibles.map(t => (
    <tr key={t.id}>
        <td>
            {t.nro_factura || '-'}
            {t.anulada && (
                <span style={{
                    marginLeft: '6px',
                    background: '#c0392b',
                    color: 'white',
                    padding: '1px 8px',
                    borderRadius: '12px',
                    fontSize: '11px'
                }}>
                    Anulada
                </span>
            )}
        </td>
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
            <select
                className="factura"
                value=""
                onChange={e => {
                    const accion = e.target.value
                    if (accion === 'facturar') emitirFactura(t.id)
                    if (accion === 'anular') anularFactura(t)
                    e.target.value = ''
                }}
            >
                <option value="" disabled>Facturación</option>
                <option value="facturar">Generar factura</option>
                <option value="anular" disabled={!t.nro_factura || t.anulada}>Nota de crédito</option>
            </select>
        </td>
    </tr>
))}
        
        </tbody>
      </table>
      </div>
      {trabajosFiltrados.length > visibleCount && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button type="button" className="editar" onClick={() => setVisibleCount(v => v + 15)}>
            Cargar más ({trabajosFiltrados.length - visibleCount} restantes)
          </button>
        </div>
      )}
      {editando && createPortal(
    <>
        <div className="editing-overlay" onClick={() => setEditando(null)} />
        <div className="editing-modal">
          <h3>Editar Trabajo</h3>
            <div className="modal-form">
                <label>Nro. Factura</label>
                <input type="text" name="nro_factura" value={formEditar.nro_factura} onChange={handleChangeEditar} />
                
                <label>Cliente</label>
                <select name="cliente_id" value={formEditar.cliente_id} onChange={handleChangeEditar}>
                    {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                </select>

                <label>Fecha</label>
                <input type="date" name="fecha" value={formEditar.fecha} onChange={handleChangeEditar} />

                <label>Fecha Entrega</label>
                <input type="date" name="fecha_entrega" value={formEditar.fecha_entrega} onChange={handleChangeEditar} />

                <label>Hojas</label>
                <input type="number" name="hojas" value={formEditar.hojas} onChange={handleChangeEditar} />

                <label>Precio por Hoja</label>
                <input type="number" name="precio_hoja" value={formEditar.precio_hoja} onChange={handleChangeEditar} />

                <label>Estado</label>
                <select name="estado" value={formEditar.estado} onChange={handleChangeEditar}>
                    <option>Pendiente</option>
                
                    <option>Entregado</option>
                    <option>Cobrado</option>
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="checkbox"
                        checked={formEditar.iva === true}
                        onChange={e => setFormEditar({ ...formEditar, iva: e.target.checked })}
                    />
                    IVA 21%
                </label>

                <p style={{ fontWeight: 600, fontSize: '16px' }}>
                    Total: {formEditar.iva ? formatearDinero(formEditar.hojas * formEditar.precio_hoja * 1.21) : formatearDinero(formEditar.hojas * formEditar.precio_hoja)}
                </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="eliminar" onClick={() => setEditando(null)}>Cancelar</button>
                <button type="button" className="agregar" onClick={guardarEdicion}>Guardar</button>
            </div>
        </div>
    </>,
    document.body
)}
  {modalFactura && createPortal(
    <>
        <div className="editing-overlay" onClick={() => setModalFactura(null)} />
        <div className="editing-modal" style={{ width: '320px', textAlign: 'center' }}>
            <h3>Tipo de Factura</h3>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>Seleccioná el tipo de comprobante</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button type="button" className="agregar" onClick={() => seleccionarTipoFactura(1)}>Factura A</button>
                <button type="button" className="agregar" onClick={() => seleccionarTipoFactura(6)}>Factura B</button>
                <button type="button" className="agregar" onClick={() => seleccionarTipoFactura(11)}>Factura C</button>
            </div>
            <div style={{ marginTop: '16px' }}>
                <button type="button" className="eliminar" onClick={() => setModalFactura(null)}>Cancelar</button>
            </div>
        </div>
    </>,
    document.body
)}
{previewFactura && createPortal(
    <>
        <div className="editing-overlay" onClick={() => setPreviewFactura(null)} />
        <div className="editing-modal" style={{ width: '500px' }}>
            <h3>Preview de Factura {previewFactura.tipo === 1 ? 'A' : previewFactura.tipo === 6 ? 'B' : 'C'}</h3>
            
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                        <p style={{ fontWeight: 600 }}>Copiado de Libros Pergamino</p>
                        <p style={{ fontSize: '13px', color: '#888' }}>CUIT: 20-14345554-9</p>
                        <p style={{ fontSize: '13px', color: '#888' }}>Estrada 1248, Pergamino</p>
                    </div>
                    <div style={{ textAlign: 'center', border: '2px solid #9b1c1c', borderRadius: '8px', padding: '8px 16px' }}>
                        <p style={{ fontSize: '32px', fontWeight: 700, color: '#9b1c1c' }}>
                            {previewFactura.tipo === 1 ? 'A' : previewFactura.tipo === 6 ? 'B' : 'C'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '13px' }}>Pto. Venta: 00005</p>
                        <p style={{ fontSize: '13px' }}>Fecha: {previewFactura.fecha}</p>
                    </div>
                </div>

                <hr style={{ marginBottom: '12px' }} />

                <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>Receptor</p>
                    <p style={{ fontSize: '13px' }}>{previewFactura.cliente}</p>
                    <p style={{ fontSize: '13px', color: '#888' }}>CUIT: {previewFactura.cuit_cliente}</p>
                </div>

                <hr style={{ marginBottom: '12px' }} />

                <table style={{ width: '100%', fontSize: '13px', marginBottom: '12px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Descripción</th>
                            <th style={{ textAlign: 'right' }}>Hojas</th>
                            <th style={{ textAlign: 'right' }}>Precio</th>
                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Servicio de copiado</td>
                            <td style={{ textAlign: 'right' }}>{previewFactura.hojas}</td>
                            <td style={{ textAlign: 'right' }}>${Number(previewFactura.precio_hoja).toLocaleString('es-AR')}</td>
                            <td style={{ textAlign: 'right' }}>${Number(previewFactura.neto).toLocaleString('es-AR')}</td>
                        </tr>
                    </tbody>
                </table>

                <hr style={{ marginBottom: '8px' }} />

                <div style={{ textAlign: 'right', fontSize: '13px' }}>
                    <p>Subtotal neto: ${Number(previewFactura.neto).toLocaleString('es-AR')}</p>
                    {previewFactura.iva > 0 && <p>IVA 21%: ${Number(previewFactura.iva).toLocaleString('es-AR')}</p>}
                    <p style={{ fontWeight: 700, fontSize: '16px', marginTop: '4px' }}>
                        Total: ${Number(previewFactura.total).toLocaleString('es-AR')}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="eliminar" onClick={() => setPreviewFactura(null)}>Cancelar</button>
                <button type="button" className="agregar" onClick={confirmarFactura}>Emitir Factura</button>
            </div>
        </div>
    </>,
    document.body
)}
{modalTipoAnular && createPortal(
    <>
        <div className="editing-overlay" onClick={() => setModalTipoAnular(null)} />
        <div className="editing-modal" style={{ width: '340px', textAlign: 'center' }}>
            <h3>Tipo de Factura Original</h3>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>
                Este trabajo no tiene registrado el tipo de comprobante. ¿Qué tipo de factura fue la N° {modalTipoAnular.nro_factura} de {modalTipoAnular.cliente_nombre}?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button type="button" className="agregar" onClick={() => seleccionarTipoAnular(1)}>Factura A</button>
                <button type="button" className="agregar" onClick={() => seleccionarTipoAnular(6)}>Factura B</button>
                <button type="button" className="agregar" onClick={() => seleccionarTipoAnular(11)}>Factura C</button>
            </div>
            <div style={{ marginTop: '16px' }}>
                <button type="button" className="eliminar" onClick={() => setModalTipoAnular(null)}>Cancelar</button>
            </div>
        </div>
    </>,
    document.body
)}
{trabajoAAnular && createPortal(
    <>
        <div className="editing-overlay" onClick={() => setTrabajoAAnular(null)} />
        <div className="editing-modal" style={{ width: '380px', textAlign: 'center' }}>
            <h3>Anular Factura</h3>
            <p style={{ color: '#888', marginBottom: '8px', fontSize: '14px' }}>
                Se emitirá una Nota de Crédito para anular la Factura {trabajoAAnular.tipo_factura === 1 ? 'A' : trabajoAAnular.tipo_factura === 6 ? 'B' : 'C'} N° {trabajoAAnular.nro_factura} de {trabajoAAnular.cliente_nombre}.
            </p>
            <p style={{ color: '#c0392b', marginBottom: '20px', fontSize: '13px' }}>
                Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button type="button" className="eliminar" onClick={() => setTrabajoAAnular(null)}>Cancelar</button>
                <button type="button" className="agregar" onClick={confirmarAnulacion}>Confirmar Anulación</button>
            </div>
        </div>
    </>,
    document.body
)}
    </div>
  )
}

export default Trabajos