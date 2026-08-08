import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export async function generarFacturaPDF(datos) {
    const { tipo, nro_comprobante, fecha, cliente, cuit_cliente, hojas, precio_hoja, neto, iva, total, cae, cae_vencimiento } = datos

    const tipoNombre = tipo === 1 ? 'A' : tipo === 6 ? 'B' : 'C'
    const doc = new jsPDF()

    // Marco exterior
    doc.rect(10, 10, 190, 277)

    // Encabezado izquierdo - datos del emisor
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Copiado de Libros', 15, 25)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Estrada 1248, Pergamino', 15, 32)
    doc.text('Buenos Aires, Argentina', 15, 38)
    doc.text('CUIT: 20-14345554-9', 15, 44)
    doc.text('IVA Responsable Inscripto', 15, 50)

    // Recuadro central con letra
    doc.rect(85, 12, 40, 24)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text(tipoNombre, 105, 30, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('COD. 0' + tipo, 105, 36, { align: 'center' })

    // Encabezado derecho - datos del comprobante
    doc.setFontSize(10)
    doc.text(`Punto de Venta: 00005`, 130, 20)
    doc.text(`Comp. Nro: ${String(nro_comprobante).padStart(8, '0')}`, 130, 27)
    doc.text(`Fecha: ${fecha}`, 130, 34)

    // Línea separadora
    doc.line(10, 60, 200, 60)

    // Datos del receptor
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('RECEPTOR', 15, 68)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nombre: ${cliente}`, 15, 76)
    doc.text(`CUIT: ${cuit_cliente}`, 15, 83)
    doc.text(`Condición IVA: Responsable Inscripto`, 15, 90)

    // Línea separadora
    doc.line(10, 96, 200, 96)

    // Detalle
    doc.setFont('helvetica', 'bold')
    doc.text('Descripción', 15, 104)
    doc.text('Cantidad', 110, 104)
    doc.text('Precio Unit.', 140, 104)
    doc.text('Subtotal', 170, 104)
    doc.line(10, 107, 200, 107)

    doc.setFont('helvetica', 'normal')
    doc.text('Servicio de copiado de libros', 15, 115)
    doc.text(String(hojas), 120, 115)
    doc.text(`$${Number(precio_hoja).toLocaleString('es-AR')}`, 140, 115)
    doc.text(`$${Number(neto).toLocaleString('es-AR')}`, 170, 115)

    // Totales
    doc.line(10, 200, 200, 200)
    doc.setFont('helvetica', 'bold')
    doc.text('Subtotal Neto:', 130, 210)
    doc.setFont('helvetica', 'normal')
    doc.text(`$${Number(neto).toLocaleString('es-AR')}`, 185, 210, { align: 'right' })

    if (iva > 0) {
        doc.setFont('helvetica', 'bold')
        doc.text('IVA 21%:', 130, 218)
        doc.setFont('helvetica', 'normal')
        doc.text(`$${Number(iva).toLocaleString('es-AR')}`, 185, 218, { align: 'right' })
    }

    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL:', 130, 226)
    doc.text(`$${Number(total).toLocaleString('es-AR')}`, 185, 226, { align: 'right' })

    // CAE
    doc.line(10, 240, 200, 240)
    doc.setFontSize(9)
    doc.text(`CAE: ${cae}`, 15, 248)
    doc.text(`Vencimiento CAE: ${cae_vencimiento}`, 15, 255)

    // QR Code
    const qrData = `https://www.afip.gob.ar/fe/qr/?p=${btoa(JSON.stringify({
        ver: 1,
        fecha: fecha,
        cuit: 20143455549,
        ptoVta: 5,
        tipoCmp: tipo,
        nroCmp: nro_comprobante,
        importe: total,
        moneda: 'PES',
        ctz: 1,
        tipoDocRec: 80,
        nroDocRec: parseInt(cuit_cliente.replace(/[-\s]/g, '')),
        tipoCodAut: 'E',
        codAut: cae
    }))}`

    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 80 })
    doc.addImage(qrDataUrl, 'PNG', 155, 240, 40, 40)

    doc.save(`factura-${tipoNombre}-${nro_comprobante}.pdf`)
}