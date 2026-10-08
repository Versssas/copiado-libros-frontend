import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'

const formatearDinero = (monto) => {
  return '$' + Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function TablaOrdenable({ columnas, filas }) {
  const [orden, setOrden] = useState({ campo: columnas[0].key, direccion: 'asc' })

  const valorOrden = (fila, columna) => columna.sortValue ? columna.sortValue(fila) : fila[columna.key]

  const ordenar = (campo) => {
    setOrden(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }))
  }

  const columnaActiva = columnas.find(c => c.key === orden.campo)
  const filasOrdenadas = [...filas].sort((a, b) => {
    const valA = valorOrden(a, columnaActiva)
    const valB = valorOrden(b, columnaActiva)
    const cmp = typeof valA === 'number' && typeof valB === 'number'
      ? valA - valB
      : String(valA).localeCompare(String(valB), 'es', { numeric: true, sensitivity: 'base' })
    return orden.direccion === 'asc' ? cmp : -cmp
  })

  return (
    <table>
      <thead>
        <tr>
          {columnas.map(c => (
            <th key={c.key} onClick={() => ordenar(c.key)} className="th-ordenable">
              {c.label}
              <span
                className="flecha-orden"
                style={{
                  transform: `rotate(${orden.campo === c.key && orden.direccion === 'desc' ? 180 : 0}deg)`,
                  opacity: orden.campo === c.key ? 1 : 0.35
                }}
              >↓</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody key={`${orden.campo}-${orden.direccion}`} className="filas-ordenadas">
        {filasOrdenadas.map((fila, i) => (
          <tr key={i} style={{ animationDelay: `${Math.min(i, 8) * 18}ms` }}>
            {columnas.map(c => (
              <td key={c.key}>{c.format ? c.format(fila[c.key]) : fila[c.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const PERIODOS = [
  { value: 'todo', label: 'Todo' },
  { value: 'mes', label: 'Este mes' },
  { value: 'trimestre', label: 'Últimos 3 meses' },
  { value: 'anio', label: 'Este año' },
]

function Estadisticas({ trabajos }) {
  const [periodo, setPeriodo] = useState('todo')

  const dentroDePeriodo = (fechaStr) => {
    const fecha = new Date(fechaStr)
    const ahora = new Date()
    if (periodo === 'mes') {
      return fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth()
    }
    if (periodo === 'trimestre') {
      const hace3Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1)
      return fecha >= hace3Meses
    }
    if (periodo === 'anio') {
      return fecha.getFullYear() === ahora.getFullYear()
    }
    return true
  }

  const trabajosFiltrados = trabajos.filter(t => dentroDePeriodo(t.fecha))

  const porMes = trabajosFiltrados.reduce((acc, t) => {
    const [year, month] = t.fecha.split('T')[0].split('-')
    const clave = `${year}-${month}`
    const fecha = new Date(year, month - 1, 1)
    const mes = fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    if (!acc[clave]) acc[clave] = { mes: mes.charAt(0).toUpperCase() + mes.slice(1), total: 0, cantidad: 0, hojas: 0 }
    acc[clave].total += Number(t.total)
    acc[clave].cantidad += 1
    acc[clave].hojas += Number(t.hojas)
    return acc
  }, {})

  const mesesOrdenados = Object.entries(porMes).sort(([a], [b]) => a.localeCompare(b))

  const porEstado = trabajosFiltrados.reduce((acc, t) => {
    if (!acc[t.estado]) acc[t.estado] = { estado: t.estado, cantidad: 0, total: 0 }
    acc[t.estado].cantidad += 1
    acc[t.estado].total += Number(t.total)
    return acc
  }, {})

  const cobrado = trabajosFiltrados
    .filter(t => t.estado === 'Cobrado')
    .reduce((acc, t) => acc + Number(t.total), 0)

  const pendiente = trabajosFiltrados
    .filter(t => t.estado !== 'Cobrado')
    .reduce((acc, t) => acc + Number(t.total), 0)

  const porEstudio = trabajosFiltrados.reduce((acc, t) => {
    const nombre = t.estudio_contable_nombre || 'Sin estudio contable'
    if (!acc[nombre]) acc[nombre] = { nombre, cantidad: 0, cobrado: 0, pendiente: 0 }
    acc[nombre].cantidad += 1
    if (t.estado === 'Cobrado') {
      acc[nombre].cobrado += Number(t.total)
    } else {
      acc[nombre].pendiente += Number(t.total)
    }
    return acc
  }, {})

  const porCliente = trabajosFiltrados.reduce((acc, t) => {
    const nombre = t.cliente_nombre
    if (!acc[nombre]) acc[nombre] = { nombre, cantidad: 0, cobrado: 0, pendiente: 0 }
    acc[nombre].cantidad += 1
    if (t.estado === 'Cobrado') {
      acc[nombre].cobrado += Number(t.total)
    } else {
      acc[nombre].pendiente += Number(t.total)
    }
    return acc
  }, {})

  const hojasTotales = trabajosFiltrados.reduce((acc, t) => acc + Number(t.hojas), 0)
  const promedioPorTrabajo = trabajosFiltrados.length ? (cobrado + pendiente) / trabajosFiltrados.length : 0
  const estudioTop = Object.values(porEstudio).sort((a, b) => (b.cobrado + b.pendiente) - (a.cobrado + a.pendiente))[0]

  const datosGrafico = mesesOrdenados.map(([, datos]) => ({
    mes: datos.mes,
    total: Number(datos.total)
  }))

  return (
    <div>
      <h2>Estadísticas</h2>

      <div
        className="segmented-control"
        role="group"
        aria-label="Filtrar por período"
        style={{ '--i': PERIODOS.findIndex(p => p.value === periodo), marginBottom: '20px' }}
      >
        <div className="indicador" />
        {PERIODOS.map(p => (
          <button
            key={p.value}
            type="button"
            className={periodo === p.value ? 'activo' : ''}
            onClick={() => setPeriodo(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div key={periodo} className="fade-periodo">
      <div className="stats-cards">
        <div className="stat-card verde">
          <h3>Total Cobrado</h3>
          <p>{formatearDinero(cobrado)}</p>
        </div>
        <div className="stat-card rojo">
          <h3>Pendiente de Cobro</h3>
          <p>{formatearDinero(pendiente)}</p>
        </div>
        <div className="stat-card gris">
          <h3>Total Facturado</h3>
          <p>{formatearDinero(cobrado + pendiente)}</p>
        </div>
      </div>

      <div className="stats-cards" style={{ marginTop: '16px' }}>
        <div className="stat-card gris">
          <h3>Promedio por Trabajo</h3>
          <p>{formatearDinero(promedioPorTrabajo)}</p>
        </div>
        <div className="stat-card gris">
          <h3>Hojas Copiadas</h3>
          <p>{hojasTotales.toLocaleString('es-AR')}</p>
        </div>
        <div className="stat-card gris">
          <h3>Estudio que Más Facturó</h3>
          <p style={{ fontSize: '16px' }}>{estudioTop ? estudioTop.nombre : '—'}</p>
        </div>
      </div>

      <div className="stats-tables">
        <h3 className="subtitulo">Trabajos por Estado</h3>
        <TablaOrdenable
          columnas={[
            { key: 'estado', label: 'Estado' },
            { key: 'cantidad', label: 'Cantidad' },
            { key: 'total', label: 'Total', format: formatearDinero },
          ]}
          filas={Object.values(porEstado)}
        />

        <h3 className="subtitulo">Facturación por Mes</h3>
        <div style={{ width: '100%', height: 350, marginBottom: '32px', overflowX: 'auto' }}>
          <div style={{ minWidth: Math.max(280, datosGrafico.length * 90), height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafico} margin={{ top: 30, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#44444440" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 13 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} tickFormatter={(v) => '$' + Number(v).toLocaleString('es-AR')} />
                <Tooltip formatter={(v) => ['$' + Number(v).toLocaleString('es-AR'), 'Total']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                <Bar dataKey="total" fill="#c0392b" radius={[6,6,0,0]} maxBarSize={80}>
                  <LabelList dataKey="total" position="top" formatter={(v) => '$' + Number(v).toLocaleString('es-AR')} style={{ fill: 'currentColor', fontSize: 12, fontWeight: 500 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <TablaOrdenable
          columnas={[
            { key: 'mes', label: 'Mes', sortValue: (fila) => mesesOrdenados.find(([, d]) => d.mes === fila.mes)?.[0] },
            { key: 'cantidad', label: 'Cantidad' },
            { key: 'hojas', label: 'Hojas' },
            { key: 'total', label: 'Total', format: formatearDinero },
          ]}
          filas={mesesOrdenados.map(([, datos]) => datos)}
        />

        <h3 className="subtitulo">Trabajos por Estudio</h3>
        <TablaOrdenable
          columnas={[
            { key: 'nombre', label: 'Estudio Contable' },
            { key: 'cantidad', label: 'Cantidad de trabajos' },
            { key: 'cobrado', label: 'Cobrado', format: formatearDinero },
            { key: 'pendiente', label: 'A Cobrar', format: formatearDinero },
          ]}
          filas={Object.values(porEstudio)}
        />

        <h3 className="subtitulo">Por Cliente</h3>
        <TablaOrdenable
          columnas={[
            { key: 'nombre', label: 'Cliente' },
            { key: 'cantidad', label: 'Cantidad de trabajos' },
            { key: 'cobrado', label: 'Cobrado', format: formatearDinero },
            { key: 'pendiente', label: 'A Cobrar', format: formatearDinero },
          ]}
          filas={Object.values(porCliente)}
        />
      </div>
      </div>
    </div>
  )
}

export default Estadisticas
