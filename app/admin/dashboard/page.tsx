// app/mis-pedidos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingBag, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Truck,
  FileText,
  CreditCard,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

// Interfaces basadas en la estructura del backend
interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  imagenUrl: string;
  categoria: string;
}

interface ItemOrden {
  id: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: string;
}

interface Orden {
  id: number;
  idUsuario: number;
  total: number;
  fechaOrden: string;
  estado: string;
  items: ItemOrden[];
  metodoPago: string;
  direccionEnvio: string;
}

interface ClienteInfo {
  rucDni: string;
  nombre: string;
  direccion: string;
}

export default function MisPedidosPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [clienteInfo, setClienteInfo] = useState<ClienteInfo>({
    rucDni: '',
    nombre: '',
    direccion: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [loadingFactura, setLoadingFactura] = useState(false);

  // Cargar órdenes del usuario
  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No autorizado. Inicia sesión nuevamente.');
      }

      // Obtener ID del usuario del token o localStorage
      const userData = localStorage.getItem('user');
      let userId = 0;
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user.id || user.IdUsuario || user.idUsuario;
        } catch (e) {
          console.error('Error parseando user data:', e);
        }
      }

      let url = 'https://localhost:7220/api/Orden/mis-ordenes';
      
      // Si tenemos userId, usamos la ruta específica
      if (userId) {
        url = `https://localhost:7220/api/Orden/usuario/${userId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(`Error al cargar órdenes: ${response.status}`);
      }

      const data = await response.json();
      console.log('Datos de órdenes recibidos:', data);
      
      // Procesar las órdenes para asegurar estructura consistente
      const ordenesProcesadas = data.map((orden: any) => ({
        id: orden.IdOrden || orden.idOrden || orden.id || 0,
        idUsuario: orden.IdUsuario || orden.idUsuario || orden.usuarioId || 0,
        total: orden.Total !== undefined ? parseFloat(orden.Total) : 
               orden.total !== undefined ? parseFloat(orden.total) : 0,
        fechaOrden: orden.FechaOrden || orden.fechaOrden || orden.fecha || 'Fecha no disponible',
        estado: orden.Status || orden.status || orden.estado || 'pendiente',
        metodoPago: orden.MetodoPago || orden.metodoPago || orden.metodoPagoDescripcion || 'No especificado',
        direccionEnvio: orden.DireccionEnvio || orden.direccionEnvio || 'Dirección no disponible',
        items: (orden.Items || orden.items || []).map((item: any) => ({
          id: item.IdItemOrden || item.idItemOrden || item.id || 0,
          cantidad: item.Cantidad || item.cantidad || 1,
          precioUnitario: item.PrecioUnitario || item.precioUnitario || item.precio || '0',
          producto: {
            id: item.IdProducto || item.idProducto || item.producto?.id || 0,
            nombre: item.ProductoNombre || item.producto?.nombre || item.producto?.Nombre || 'Producto',
            descripcion: item.ProductoDescripcion || item.producto?.descripcion || '',
            precio: item.ProductoPrecio || item.producto?.precio || item.precioUnitario || '0',
            imagenUrl: item.ProductoImagen || item.producto?.imagenUrl || '/placeholder-product.jpg',
            categoria: item.ProductoCategoria || item.producto?.categoria || ''
          }
        }))
      }));

      setOrdenes(ordenesProcesadas);
      setError('');
    } catch (err: any) {
      console.error('Error cargando órdenes:', err);
      setError(err.message || 'Error al cargar tus pedidos');
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoIcono = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completado':
      case 'entregado':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'pendiente':
        return <Clock className="text-yellow-500" size={20} />;
      case 'en camino':
      case 'procesando':
        return <Truck className="text-blue-500" size={20} />;
      case 'cancelado':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completado':
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en camino':
      case 'procesando':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMetodoPagoIcono = (metodo: string) => {
    switch (metodo.toLowerCase()) {
      case 'tarjeta de crédito':
      case 'credito':
      case 'credit':
        return <CreditCard size={16} />;
      case 'paypal':
        return <FileText size={16} />;
      default:
        return <CreditCard size={16} />;
    }
  };

  const formatearFecha = (fecha: string) => {
    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) {
        return fecha; // Devolver la cadena original si no es una fecha válida
      }
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return fecha;
    }
  };

  const confirmarGenerarFactura = (orden: Orden) => {
    setOrdenSeleccionada(orden);
    setMostrarModal(true);
    
    // Intentar obtener datos del usuario de localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setClienteInfo({
          rucDni: user.dni || user.ruc || '',
          nombre: `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email || '',
          direccion: user.direccion || ''
        });
      } catch (e) {
        console.error('Error parseando user data:', e);
      }
    }
  };

  const generarPDFFactura = async (orden: Orden, clienteInfo: ClienteInfo) => {
    try {
      setLoadingFactura(true);
      
      // Verificar datos obligatorios
      if (!clienteInfo.rucDni.trim()) {
        throw new Error('El RUC/DNI es obligatorio');
      }
      
      if (!clienteInfo.nombre.trim()) {
        throw new Error('El nombre es obligatorio');
      }

      // Verificar si estamos en el cliente
      if (typeof window === 'undefined') {
        throw new Error('PDF solo se puede generar en el cliente');
      }
      
      // Cargar dinámicamente las librerías - FORMA CORRECTA
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      
      // Configuración del documento
      doc.setFontSize(20);
      doc.text('FACTURA', 105, 20, { align: 'center' });
      
      // Información de la empresa
      doc.setFontSize(10);
      doc.text('EromodeShop', 20, 30);
      doc.text('Av. Principal 123, Lima, Perú', 20, 36);
      doc.text('Tel: (01) 234-5678 | RUC: 20123456789', 20, 42);
      doc.text('Email: info@eromodeshop.com', 20, 48);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, 55, 190, 55);
      
      // Información del cliente
      doc.setFontSize(12);
      doc.text('DATOS DEL CLIENTE', 20, 65);
      
      doc.setFontSize(10);
      doc.text(`Nombre: ${clienteInfo.nombre}`, 20, 75);
      doc.text(`RUC/DNI: ${clienteInfo.rucDni}`, 20, 82);
      doc.text(`Dirección: ${clienteInfo.direccion}`, 20, 89);
      
      // Información de la orden
      doc.text('INFORMACIÓN DE LA ORDEN', 120, 65);
      doc.text(`Orden #: ORD-${orden.id.toString().padStart(5, '0')}`, 120, 75);
      doc.text(`Fecha: ${formatearFecha(orden.fechaOrden)}`, 120, 82);
      doc.text(`Estado: ${orden.estado}`, 120, 89);
      doc.text(`Método de pago: ${orden.metodoPago}`, 120, 96);
      
      // Línea separadora
      doc.line(20, 103, 190, 103);
      
      // Preparar datos de la tabla
      const tableData = orden.items.map((item, index) => [
        index + 1,
        item.producto.nombre.substring(0, 40), // Limitar longitud
        item.cantidad,
        `S/. ${parseFloat(item.precioUnitario).toFixed(2)}`,
        `S/. ${(item.cantidad * parseFloat(item.precioUnitario)).toFixed(2)}`
      ]);
      
      // Calcular subtotal, IGV y total
      const subtotal = orden.items.reduce((sum, item) => 
        sum + (item.cantidad * parseFloat(item.precioUnitario)), 0);
      const igv = subtotal * 0.18;
      const total = subtotal + igv;
      
      // Agregar filas de totales
      tableData.push(['', '', '', '', '']);
      tableData.push(['', '', '', 'Subtotal:', `S/. ${subtotal.toFixed(2)}`]);
      tableData.push(['', '', '', 'IGV (18%):', `S/. ${igv.toFixed(2)}`]);
      tableData.push(['', '', '', 'TOTAL:', `S/. ${total.toFixed(2)}`]);
      
      // USO CORRECTO DE AUTOTABLE - no como método de doc
      autoTable(doc, {
        startY: 110,
        head: [['#', 'Descripción', 'Cantidad', 'P. Unit.', 'Subtotal']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [41, 128, 185], 
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 80 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' }
        },
        margin: { left: 20, right: 20 }
      });
      
      // Notas
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(9);
      doc.text('NOTAS:', 20, finalY + 10);
      doc.text('• Esta factura es generada electrónicamente por EromodeShop', 20, finalY + 16);
      doc.text('• Para consultas o reclamos contactar a servicio@eromodeshop.com', 20, finalY + 22);
      doc.text('• Gracias por su compra', 20, finalY + 28);
      
      // Pie de página
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount} • EromodeShop • ${new Date().toLocaleDateString('es-ES')}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Guardar el PDF
      const fileName = `factura_ORD-${orden.id.toString().padStart(5, '0')}_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(fileName);
      
      setLoadingFactura(false);
      return true;
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      setLoadingFactura(false);
      throw new Error(`Error al generar la factura: ${error.message}`);
    }
  };

  const handleGenerarFactura = async () => {
    if (!ordenSeleccionada) return;
    
    try {
      await generarPDFFactura(ordenSeleccionada, clienteInfo);
      alert('Factura generada exitosamente');
      setMostrarModal(false);
      setClienteInfo({ rucDni: '', nombre: '', direccion: '' });
    } catch (err: any) {
      alert(err.message || 'Error al generar la factura');
    }
  };

  // Paginación
  const totalPages = Math.ceil(ordenes.length / itemsPerPage);
  const paginatedOrdenes = ordenes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                <ShoppingBag className="inline-block mr-3" size={28} />
                Mis Pedidos
              </h1>
              <p className="text-gray-600">
                Gestiona y revisa el historial de todas tus compras
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={cargarOrdenes}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw size={18} />
                Actualizar
              </button>
              
              <div className="text-sm bg-gray-100 px-3 py-1 rounded-lg">
                <span className="font-medium">{ordenes.length}</span> pedidos
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={20} />
                <span className="font-medium">Error:</span> {error}
              </div>
              <button
                onClick={cargarOrdenes}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
          
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="text-blue-500" size={20} />
                <span className="font-medium text-blue-700">Pendientes</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {ordenes.filter(o => o.estado.toLowerCase() === 'pendiente').length}
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} />
                <span className="font-medium text-green-700">Completados</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {ordenes.filter(o => o.estado.toLowerCase() === 'completado' || o.estado.toLowerCase() === 'entregado').length}
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Truck className="text-purple-500" size={20} />
                <span className="font-medium text-purple-700">En camino</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {ordenes.filter(o => o.estado.toLowerCase() === 'en camino' || o.estado.toLowerCase() === 'procesando').length}
              </p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="text-yellow-600" size={20} />
                <span className="font-medium text-yellow-700">Total gastado</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900 mt-2">
                S/. {ordenes.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de órdenes */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {ordenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg mb-2">No tienes pedidos aún</p>
              <p className="text-gray-500 text-sm text-center px-4">
                Realiza tu primera compra para ver tus pedidos aquí
              </p>
              <a
                href="/productos"
                className="mt-6 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Explorar productos
              </a>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Orden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedOrdenes.map((orden) => (
                      <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            ORD-{orden.id.toString().padStart(5, '0')}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            {getMetodoPagoIcono(orden.metodoPago)}
                            {orden.metodoPago}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatearFecha(orden.fechaOrden)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getEstadoIcono(orden.estado)}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(orden.estado)}`}>
                              {orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-blue-600">
                            S/. {orden.total.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {orden.items.length} producto{orden.items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {orden.items.map(item => item.producto.nombre).join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => confirmarGenerarFactura(orden)}
                              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              title="Generar factura"
                            >
                              <FileText size={16} />
                              Factura
                            </button>
                            <button
                              onClick={() => {/* Ver detalles */}}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              title="Ver detalles"
                            >
                              <Eye size={16} />
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {paginatedOrdenes.map((orden) => (
                  <div key={orden.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          ORD-{orden.id.toString().padStart(5, '0')}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={14} />
                          {formatearFecha(orden.fechaOrden)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getEstadoIcono(orden.estado)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(orden.estado)}`}>
                          {orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard size={14} className="text-gray-400" />
                        <span className="text-gray-600">{orden.metodoPago}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Package size={14} className="text-gray-400" />
                        <span className="text-gray-600">
                          {orden.items.length} producto{orden.items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-gray-600 truncate">{orden.direccionEnvio}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="text-lg font-bold text-blue-600">
                        S/. {orden.total.toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmarGenerarFactura(orden)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          title="Generar factura"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => {/* Ver detalles */}}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 bg-gray-50 border-t">
                  <div className="text-sm text-gray-700 mb-2 md:mb-0">
                    Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, ordenes.length)}</span> de{' '}
                    <span className="font-medium">{ordenes.length}</span> pedidos
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 md:px-4 md:py-2 rounded-lg border transition-colors text-sm ${
                              currentPage === pageNum
                                ? 'bg-black text-white border-black'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Info size={20} />
            Información importante
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="space-y-2">
              <p className="font-medium text-gray-700">Facturación</p>
              <p>• Puedes generar facturas para todas tus compras</p>
              <p>• Los datos de facturación se guardan para futuras compras</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-700">Seguimiento</p>
              <p>• Recibirás notificaciones por email sobre el estado</p>
              <p>• El tiempo de entrega es de 3-5 días hábiles</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-700">Soporte</p>
              <p>• Para problemas con pedidos: soporte@eromodeshop.com</p>
              <p>• Horario de atención: Lunes a Viernes 9am - 6pm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para facturación */}
      {mostrarModal && ordenSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={24} />
                Generar Factura
              </h3>
              
              <p className="text-gray-600 mb-6">
                Para la orden <strong>ORD-{ordenSeleccionada.id.toString().padStart(5, '0')}</strong>
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUC/DNI *
                  </label>
                  <input
                    type="text"
                    value={clienteInfo.rucDni}
                    onChange={(e) => setClienteInfo({...clienteInfo, rucDni: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingresa tu RUC o DNI"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={clienteInfo.nombre}
                    onChange={(e) => setClienteInfo({...clienteInfo, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingresa tu nombre completo"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <textarea
                    value={clienteInfo.direccion}
                    onChange={(e) => setClienteInfo({...clienteInfo, direccion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ingresa tu dirección completa"
                    rows={3}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => {
                    setMostrarModal(false);
                    setClienteInfo({ rucDni: '', nombre: '', direccion: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loadingFactura}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerarFactura}
                  disabled={loadingFactura || !clienteInfo.rucDni.trim() || !clienteInfo.nombre.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingFactura ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Generar Factura
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}