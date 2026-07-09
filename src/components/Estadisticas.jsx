import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API = 'https://copiado-libros-backend-production.up.railway.app'

const getConfig = () => ({
    headers: { authorization: localStorage.getItem('token') }
})

function Estadisticas() {
  const [trabajos, setTrabajos] = useState([])

  useEffect(() => {
    cargarTrabajos()
  }, [])

  const cargarTrabajos = async () => {
    const res = await axios.get(`${API}/trabajos/`, getConfig())
    setTrabajos(res.data)
  }

  const formatearDinero = (monto) => {
    return '$' + Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  // Totales por mes
  const porMes = trabajos.reduce((acc, t) => {
    const mes = new Date(t.fecha).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    if (!acc[mes]) acc[mes] = { total: 0, cantidad: 0, hojas: 0 }
    acc[mes].total += Number(t.total)
    acc[mes].cantidad += 1
    acc[mes].hojas += Number(t.hojas)
    return acc
}, {})

  // Por estado
  const porEstado = trabajos.reduce((acc, t) => {
    if (!acc[t.estado]) acc[t.estado] = { cantidad: 0, total: 0 }
    acc[t.estado].cantidad += 1
    acc[t.estado].total += Number(t.total)
    return acc
  }, {})

  // Cobrado vs pendiente
  const cobrado = trabajos
    .filter(t => t.estado === 'Cobrado')
    .reduce((acc, t) => acc + Number(t.total), 0)

  const pendiente = trabajos
    .filter(t => t.estado !== 'Cobrado')
    .reduce((acc, t) => acc + Number(t.total), 0)

  const porCliente = trabajos.reduce((acc, t) => {
    const nombre = t.cliente_nombre
    if (!acc[nombre]) acc[nombre] = { cantidad: 0, cobrado : 0, pendiente: 0}
    acc[nombre].cantidad += 1
    if (t.estado === 'Cobrado') {
      acc[nombre].cobrado += Number(t.total)
    } else {
      acc[nombre].pendiente += Number(t.total)
    }
    return acc
    }, {})


    const datosGrafico = Object.entries(porMes).map(([mes, datos]) => ({
    mes: mes.charAt(0).toUpperCase() + mes.slice(1),
    total: Number(datos.total)
    }))
    return (
    <div>
      <h2>Estadísticas</h2>

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

      <div className="stats-tables">
        <h3 className="subtitulo">Trabajos por Estado</h3>
        <table>
          <thead>
            <tr>
              <th>Estado</th>
              <th>Cantidad</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(porEstado).map(([estado, datos]) => (
              <tr key={estado}>
                <td>{estado}</td>
                <td>{datos.cantidad}</td>
                <td>{formatearDinero(datos.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="subtitulo">Facturación por Mes</h3>
        <div style={{ width: '100%', height: 300, marginBottom: '32px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(v) => '$' + Number(v).toLocaleString('es-AR')} />
                    <Tooltip formatter={(v) => '$' + Number(v).toLocaleString('es-AR')} />
                    <Bar dataKey="total" fill="#c0392b" radius={[4,4,0,0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Mes</th>
                    <th>Cantidad</th>
                    <th>Hojas</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(porMes).map(([mes, datos]) => (
                    <tr key={mes}>
                        <td>{mes}</td>
                        <td>{datos.cantidad}</td>
                        <td>{datos.hojas}</td>
                        <td>{formatearDinero(datos.total)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <h3 className="subtitulo">Por Cliente</h3>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Cantidad de trabajos</th>
              <th>Cobrado</th>
              <th>A Cobrar</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(porCliente).map(([nombre, datos]) => (
              <tr key={nombre}>
                <td>{nombre}</td>
                <td>{datos.cantidad}</td>
                <td>{formatearDinero(datos.cobrado)}</td>
                <td>{formatearDinero(datos.pendiente)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default Estadisticas