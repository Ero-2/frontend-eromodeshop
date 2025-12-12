'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package, FileText, Receipt, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface OrdenResumen {
  idOrden: number;
  total: number;
  fechaOrden: string;
  metodoPago: string;
  direccionEnvio: string;
}

interface DetalleOrden {
  idDetalleOrden: number;
  producto: string;
  talla: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  status: string;
}

interface FacturaDto {
  idFactura: number;
  idOrden: number;
  numeroFactura: string;
  fechaEmision: string;
  rucDniCliente: string;
  nombreCliente: string;
  direccionCliente: string;
  totalBruto: number;
  impuestos: number;
  totalNeto: number;
  estado: string;
  pdfUrl?: string;
}

interface FacturaFormData {
  idOrden?: number;
  rucDniCliente?: string;
  nombreCliente?: string;
  direccionCliente?: string;
}

export default function MisPedidosPage() {
  const [ordenes, setOrdenes] = useState<OrdenResumen[]>([]);
  const [detalles, setDetalles] = useState<DetalleOrden[]>([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [facturaData, setFacturaData] = useState<FacturaFormData>({});
  const [facturasExistentes, setFacturasExistentes] = useState<FacturaDto[]>([]);

  const router = useRouter();

  useEffect(() => {
    const cargarDatosUsuario = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('Usuario cargado:', user);
          setUserData(user);
          
          // Prellenar datos para factura
          setFacturaData(prev => ({
            ...prev,
            nombreCliente: user.nombre || ''
          }));
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    };

    cargarDatosUsuario();
    cargarOrdenes();
  }, [router]);

  const cargarOrdenes = async () => {
    const token = localStorage.getItem('token');
    console.log('Token para cargar órdenes:', token ? 'Presente' : 'No encontrado');
    
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      console.log('Iniciando carga de órdenes...');
      const res = await fetch('https://localhost:7220/api/orden', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta status:', res.status);
      console.log('Respuesta ok:', res.ok);

      if (res.ok) {
        const text = await res.text();
        console.log('Texto de respuesta:', text);
        
        if (text && text.trim() !== '') {
          try {
            const data = JSON.parse(text);
            console.log('Órdenes parseadas:', data);
            setOrdenes(data);
            setError(null);
          } catch (parseError) {
            console.error('Error parseando JSON:', parseError);
            setError('Formato de respuesta inválido del servidor');
            setOrdenes([]);
          }
        } else {
          console.log('Respuesta vacía - sin órdenes');
          setOrdenes([]);
          setError(null);
        }
      } else {
        console.error('Error en respuesta HTTP:', res.status, res.statusText);
        const text = await res.text();
        console.error('Texto de error:', text);
        
        let errorMsg = 'No se pudieron cargar tus pedidos.';
        if (res.status === 401) {
          errorMsg = 'Sesión expirada. Por favor inicia sesión nuevamente.';
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        } else if (res.status === 403) {
          errorMsg = 'No tienes permisos para ver estas órdenes.';
        } else if (text) {
          try {
            const err = JSON.parse(text);
            errorMsg = err.error || err.message || errorMsg;
          } catch {
            errorMsg = `Error ${res.status}: ${res.statusText}`;
          }
        }
        setError(errorMsg);
        setOrdenes([]);
      }
    } catch (err) {
      console.error('Error de conexión:', err);
      setError('Error de conexión con el servidor. Verifica tu conexión a internet.');
      setOrdenes([]);
    } finally {
      console.log('Carga de órdenes finalizada');
      setLoading(false);
    }
  };

  const verDetalles = async (id: number) => {
    if (ordenSeleccionada === id) {
      setOrdenSeleccionada(null);
      setDetalles([]);
      return;
    }

    setLoadingDetalles(true);
    setOrdenSeleccionada(id);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      console.log('Cargando detalles para orden:', id);
      
      // Cargar detalles de la orden
      const resDetalles = await fetch(`https://localhost:7220/api/orden/${id}/detalles`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Detalles status:', resDetalles.status);

      if (resDetalles.ok) {
        const textDetalles = await resDetalles.text();
        console.log('Texto de detalles:', textDetalles);
        
        if (textDetalles && textDetalles.trim() !== '') {
          try {
            const detallesData = JSON.parse(textDetalles);
            console.log('Detalles parseados:', detallesData);
            setDetalles(detallesData);
          } catch (parseError) {
            console.error('Error parseando detalles:', parseError);
            setError('Error al procesar los detalles del pedido');
            setDetalles([]);
          }
        } else {
          console.log('Sin detalles para esta orden');
          setDetalles([]);
        }
      } else {
        console.error('Error cargando detalles:', resDetalles.status);
        const errorText = await resDetalles.text();
        console.error('Texto de error detalles:', errorText);
        setDetalles([]);
      }

      // Cargar facturas existentes para esta orden
      try {
        const resFacturas = await fetch(`https://localhost:7220/api/facturas/mis-facturas`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (resFacturas.ok) {
          const textFacturas = await resFacturas.text();
          if (textFacturas && textFacturas.trim() !== '') {
            try {
              const facturasData = JSON.parse(textFacturas);
              console.log('Facturas cargadas:', facturasData);
              // Filtrar facturas de esta orden
              const facturasOrden = facturasData.filter((f: FacturaDto) => f.idOrden === id);
              console.log('Facturas para esta orden:', facturasOrden);
              setFacturasExistentes(facturasOrden);
            } catch (parseError) {
              console.error('Error parseando facturas:', parseError);
            }
          }
        }
      } catch (facturaError) {
        console.error('Error cargando facturas:', facturaError);
        // No mostramos error al usuario por esto
      }

    } catch (err) {
      console.error('Error al cargar detalles:', err);
      setError('Error al cargar los detalles del pedido.');
      setDetalles([]);
    } finally {
      console.log('Carga de detalles finalizada');
      setLoadingDetalles(false);
    }
  };

  const generarFactura = async (idOrden: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    console.log('Generando factura para orden:', idOrden);

    // Verificar si ya existe una factura para esta orden
    const facturaExistente = facturasExistentes.find(f => f.idOrden === idOrden);
    if (facturaExistente) {
      console.log('Factura existente encontrada:', facturaExistente);
      // Si ya existe, descargar la factura
      descargarFacturaPDF(facturaExistente);
      return;
    }

    // Mostrar modal para completar datos
    console.log('Mostrando modal para factura');
    setFacturaData({
      idOrden,
      nombreCliente: userData?.nombre || ''
    });
    setShowFacturaModal(true);
  };

  const confirmarGenerarFactura = async () => {
    console.log('Confirmando factura con datos:', facturaData);
    
    if (!facturaData.rucDniCliente || !facturaData.nombreCliente || !facturaData.direccionCliente) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = `https://localhost:7220/api/facturas/generar/${facturaData.idOrden}`;
      console.log('URL de generación:', url);
      
      const requestBody = {
        RUC_DNI_Cliente: facturaData.rucDniCliente,
        NombreCliente: facturaData.nombreCliente,
        DireccionCliente: facturaData.direccionCliente
      };
      console.log('Request body:', requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const text = await response.text();
        console.log('Respuesta de factura:', text);
        
        if (text) {
          const nuevaFactura = JSON.parse(text);
          console.log('Factura generada:', nuevaFactura);
          alert('Factura generada exitosamente');
          setShowFacturaModal(false);
          
          // Actualizar lista de facturas
          setFacturasExistentes([...facturasExistentes, nuevaFactura]);
          
          // Descargar PDF
          generarPDFFactura(nuevaFactura);
        }
      } else {
        const text = await response.text();
        console.error('Error response text:', text);
        
        let errorMsg = 'Error al generar la factura';
        try {
          const error = JSON.parse(text);
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Error ${response.status}: ${response.statusText}`;
        }
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error al generar factura:', error);
      alert('Error al generar la factura. Verifica tu conexión.');
    }
  };

  const generarTicket = (orden: OrdenResumen, detalles: DetalleOrden[]) => {
    console.log('Generando ticket para orden:', orden.idOrden);
    
    const doc = new jsPDF();
    
    // Configuración inicial
    const marginLeft = 14;
    let yPos = 20;
    
    // Encabezado
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIPTIFY', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('EROMODESHOP', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
    
    // Información del ticket
    yPos += 15;
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date(orden.fechaOrden).toLocaleDateString('es-ES')}`, marginLeft, yPos);
    doc.text(`Hora: ${new Date(orden.fechaOrden).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, doc.internal.pageSize.getWidth() - marginLeft, yPos, { align: 'right' });
    
    yPos += 5;
    doc.text(`Orden #: ${orden.idOrden}`, marginLeft, yPos);
    doc.text(`Método: ${orden.metodoPago || 'No especificado'}`, doc.internal.pageSize.getWidth() - marginLeft, yPos, { align: 'right' });
    
    yPos += 10;
    
    // Tabla de productos
    const tableData = detalles.map((detalle, index) => [
      index + 1,
      detalle.producto,
      detalle.talla,
      detalle.cantidad,
      `$${detalle.precioUnitario.toFixed(2)}`,
      `$${detalle.subtotal.toFixed(2)}`
    ]);

    (doc as any).autoTable({
      startY: yPos,
      head: [['#', 'Producto', 'Talla', 'Cant', 'P. Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] },
      margin: { left: marginLeft, right: marginLeft }
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', doc.internal.pageSize.getWidth() - marginLeft - 50, finalY);
    doc.text(`$${orden.total.toFixed(2)}`, doc.internal.pageSize.getWidth() - marginLeft, finalY, { align: 'right' });
    
    // Dirección
    doc.setFont('helvetica', 'normal');
    doc.text(`Dirección: ${orden.direccionEnvio || 'No especificada'}`, marginLeft, finalY + 10);
    
    // Pie de página
    doc.setFontSize(8);
    doc.text('Gracias por su compra', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
    doc.text('www.eromodeshop.com', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
    
    // Guardar PDF
    doc.save(`ticket-orden-${orden.idOrden}.pdf`);
  };

  const generarPDFFactura = (factura: FacturaDto) => {
    console.log('Generando PDF de factura:', factura);
    
    const doc = new jsPDF();
    
    const marginLeft = 20;
    let yPos = 20;
    
    // Encabezado
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', marginLeft, yPos);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nº ${factura.numeroFactura}`, doc.internal.pageSize.getWidth() - marginLeft, yPos, { align: 'right' });
    
    // Información de la factura
    yPos += 15;
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date(factura.fechaEmision).toLocaleDateString('es-ES')}`, marginLeft, yPos);
    doc.text(`Estado: ${factura.estado.toUpperCase()}`, doc.internal.pageSize.getWidth() - marginLeft, yPos, { align: 'right' });
    
    // Información del cliente
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE:', marginLeft, yPos);
    
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${factura.nombreCliente}`, marginLeft, yPos);
    
    yPos += 5;
    doc.text(`RUC/DNI: ${factura.rucDniCliente}`, marginLeft, yPos);
    
    yPos += 5;
    doc.text(`Dirección: ${factura.direccionCliente}`, marginLeft, yPos);
    
    // Tabla de productos
    yPos += 15;
    
    // Para la tabla, necesitaríamos obtener los detalles reales
    const tableData = [
      ['1', 'Producto de ejemplo', '2', `$${factura.totalBruto.toFixed(2)}`, `$${factura.totalBruto.toFixed(2)}`]
    ];
    
    (doc as any).autoTable({
      startY: yPos,
      head: [['#', 'Descripción', 'Cantidad', 'P. Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] },
      margin: { left: marginLeft, right: marginLeft }
    });
    
    // Totales
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(11);
    doc.text('Subtotal:', doc.internal.pageSize.getWidth() - marginLeft - 60, finalY);
    doc.text(`$${factura.totalBruto.toFixed(2)}`, doc.internal.pageSize.getWidth() - marginLeft, finalY, { align: 'right' });
    
    doc.text('Impuestos (16%):', doc.internal.pageSize.getWidth() - marginLeft - 60, finalY + 7);
    doc.text(`$${factura.impuestos.toFixed(2)}`, doc.internal.pageSize.getWidth() - marginLeft, finalY + 7, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', doc.internal.pageSize.getWidth() - marginLeft - 60, finalY + 17);
    doc.text(`$${factura.totalNeto.toFixed(2)}`, doc.internal.pageSize.getWidth() - marginLeft, finalY + 17, { align: 'right' });
    
    // Pie de página
    doc.setFontSize(8);
    doc.text('Gracias por su preferencia', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    
    // Guardar PDF
    doc.save(`factura-${factura.numeroFactura}.pdf`);
  };

  const descargarFacturaPDF = (factura: FacturaDto) => {
    console.log('Descargando factura PDF:', factura);
    
    if (factura.pdfUrl) {
      // Si hay URL del PDF, descargarlo
      window.open(factura.pdfUrl, '_blank');
    } else {
      // Generar PDF localmente
      generarPDFFactura(factura);
    }
  };

  // Botón para recargar
  const recargarOrdenes = () => {
    setLoading(true);
    setError(null);
    cargarOrdenes();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center">
        <Loader2 className="animate-spin text-gray-600 mb-4" size={32} />
        <p className="text-gray-600">Cargando tus pedidos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Pedidos</h1>
        <button
          onClick={recargarOrdenes}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
        >
          Recargar
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
            <button
              onClick={recargarOrdenes}
              className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {ordenes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="mx-auto text-gray-400" size={48} />
          <h2 className="text-xl font-semibold mt-4">No tienes pedidos aún</h2>
          <p className="text-gray-600 mt-2">Cuando realices tu primera compra, aparecerá aquí.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Ir a la tienda
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-gray-600">
            Mostrando {ordenes.length} pedido{ordenes.length !== 1 ? 's' : ''}
          </p>
          
          {ordenes.map((orden, index) => (
            <div
              key={`orden-${orden.idOrden ?? index}`}
              className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className="bg-white p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
                onClick={() => verDetalles(orden.idOrden)}
              >
                <div>
                  <h3 className="text-lg font-semibold">Pedido #{orden.idOrden ?? 'N/A'}</h3>
                  <p className="text-gray-600 text-sm">
                    {new Date(orden.fechaOrden).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {orden.metodoPago} • {orden.direccionEnvio}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${(orden.total ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ordenSeleccionada === orden.idOrden ? 'Ocultar detalles' : 'Ver detalles'}
                  </p>
                </div>
              </div>

              {ordenSeleccionada === orden.idOrden && (
                <div className="bg-gray-50 p-5 border-t">
                  {loadingDetalles ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin text-gray-500" size={24} />
                      <span className="ml-2 text-gray-600">Cargando detalles...</span>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 mb-6">
                        {detalles.length > 0 ? (
                          detalles.map((detalle, idx) => (
                            <div
                              key={`detalle-${detalle.idDetalleOrden ?? idx}`}
                              className="flex items-start justify-between p-3 bg-white rounded-lg border"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{detalle.producto || 'Producto sin nombre'}</p>
                                <p className="text-sm text-gray-600">
                                  Talla: {detalle.talla || 'N/A'} • Cantidad: {detalle.cantidad || 0}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Precio: ${(detalle.precioUnitario ?? 0).toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-semibold">${(detalle.subtotal ?? 0).toFixed(2)}</p>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                                  detalle.status === 'completado' ? 'bg-green-100 text-green-700' :
                                  detalle.status === 'procesado' ? 'bg-blue-100 text-blue-700' :
                                  detalle.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-200 text-gray-700'
                                }`}>
                                  {detalle.status || 'pendiente'}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">No hay detalles disponibles para este pedido.</p>
                        )}
                      </div>

                      {/* Botones de facturación y ticket */}
                      <div className="flex gap-3 pt-4 border-t">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generarFactura(orden.idOrden);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <FileText size={18} />
                          {facturasExistentes.find(f => f.idOrden === orden.idOrden) 
                            ? 'Ver Factura' 
                            : 'Generar Factura'}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generarTicket(orden, detalles);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          disabled={detalles.length === 0}
                        >
                          <Receipt size={18} />
                          Generar Ticket
                        </button>

                        {facturasExistentes.find(f => f.idOrden === orden.idOrden) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const factura = facturasExistentes.find(f => f.idOrden === orden.idOrden);
                              if (factura) descargarFacturaPDF(factura);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition ml-auto"
                          >
                            <Download size={18} />
                            Descargar PDF
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal para generar factura */}
      {showFacturaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Generar Factura</h3>
            <p className="text-gray-600 text-sm mb-4">Para la orden #{facturaData.idOrden}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">RUC/DNI *</label>
                <input
                  type="text"
                  value={facturaData.rucDniCliente || ''}
                  onChange={(e) => setFacturaData({...facturaData, rucDniCliente: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese RUC o DNI"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={facturaData.nombreCliente || ''}
                  onChange={(e) => setFacturaData({...facturaData, nombreCliente: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre del cliente"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Dirección *</label>
                <textarea
                  value={facturaData.direccionCliente || ''}
                  onChange={(e) => setFacturaData({...facturaData, direccionCliente: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección completa"
                  rows={3}
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowFacturaModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarGenerarFactura}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Generar Factura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}