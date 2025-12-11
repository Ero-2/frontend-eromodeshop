'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Download,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileJson,
  Database
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Interfaces actualizadas para coincidir con la estructura esperada por el frontend
interface UsuarioProcesado {
  id: number;
  nombre: string;
  email: string;
  fechaRegistro: string;
  compras: number;
}

interface ProductoProcesado {
  id: number;
  nombre: string;
  marca: string;
  precio: string;
  stock: number;
}

interface VentaProcesada {
  id: number;
  orden: string;
  cliente: string;
  total: string;
  fecha: string;
  estado: string;
}

interface ConteoDatos {
  usuarios: number;
  productos: number;
  ventas: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'productos' | 'ventas'>('usuarios');
  const [data, setData] = useState<UsuarioProcesado[] | ProductoProcesado[] | VentaProcesada[]>([]);
  const [conteo, setConteo] = useState<ConteoDatos>({
    usuarios: 0,
    productos: 0,
    ventas: 0
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Cargar datos reales desde el backend
  useEffect(() => {
    loadData();
    cargarConteos();
  }, [activeTab, currentPage]);

  const cargarConteos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [usuariosRes, productosRes, ventasRes] = await Promise.all([
        fetch('https://localhost:7220/api/Usuarios', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('https://localhost:7220/api/Productos', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('https://localhost:7220/api/Orden/todas', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      const usuarios = usuariosRes.ok ? await usuariosRes.json() : [];
      const productos = productosRes.ok ? await productosRes.json() : [];
      const ventas = ventasRes.ok ? await ventasRes.json() : [];

      setConteo({
        usuarios: usuarios.length || 0,
        productos: productos.length || 0,
        ventas: ventas.length || 0
      });
    } catch (error) {
      console.error('Error cargando conteos:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No autorizado. Inicia sesión nuevamente.');
      }

      let url = '';
      switch (activeTab) {
        case 'usuarios':
          url = 'https://localhost:7220/api/Usuarios';
          break;
        case 'productos':
          url = 'https://localhost:7220/api/Productos';
          break;
        case 'ventas':
          url = 'https://localhost:7220/api/Orden/todas';
          break;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Error al cargar ${activeTab}: ${res.status}`);
      }

      const rawData = await res.json();

      // Procesar los datos según la pestaña
      let processedData: any[] = [];
      
      switch (activeTab) {
        case 'usuarios':
          processedData = rawData.map((u: any) => {
            const nombre = u.Nombre || u.nombre || '';
            const apellido = u.Apellido || u.apellido || '';
            
            const nombreCompleto = [
              nombre?.trim(),
              apellido?.trim()
            ].filter(Boolean).join(' ') || 'Sin nombre';

            let fechaRegistro = 'N/A';
            const fechaRaw = u.FechaCreacion || u.fechaCreacion || u.FechaRegistro || u.fechaRegistro;
            
            if (fechaRaw) {
              try {
                const dateObj = new Date(fechaRaw);
                if (!isNaN(dateObj.getTime())) {
                  fechaRegistro = dateObj.toLocaleDateString('es-ES');
                }
              } catch (e) {
                console.error('Error parseando fecha:', e);
              }
            }

            return {
              id: u.IdUsuario || u.idUsuario || u.id || 0,
              nombre: nombreCompleto,
              email: u.Email || u.email || 'Sin email',
              fechaRegistro: fechaRegistro,
              compras: 0
            };
          });
          break;
          
        case 'productos':
          processedData = rawData.map((p: any) => {
            const marcaNombre = p.marca?.nombre || 
                               p.Marca?.Nombre || 
                               p.marca?.Nombre || 
                               'Sin marca';
            
            let stockTotal = 0;
            if (p.Inventarios && Array.isArray(p.Inventarios)) {
              stockTotal = p.Inventarios.reduce((sum: number, i: any) => {
                return sum + (i.Stock || i.stock || 0);
              }, 0);
            } else if (p.inventarios && Array.isArray(p.inventarios)) {
              stockTotal = p.inventarios.reduce((sum: number, i: any) => {
                return sum + (i.Stock || i.stock || 0);
              }, 0);
            }

            return {
              id: p.IdProducto || p.idProducto || p.id || 0,
              nombre: p.Nombre || p.nombre || 'Sin nombre',
              marca: marcaNombre,
              precio: p.Precio !== null && p.Precio !== undefined ? 
                     parseFloat(p.Precio).toFixed(2) : 
                     (p.precio ? parseFloat(p.precio).toFixed(2) : '0.00'),
              stock: stockTotal
            };
          });
          break;
          
        case 'ventas':
          processedData = rawData.map((o: any) => {
            return {
              id: o.IdOrden || o.idOrden || o.id || 0,
              orden: `ORD-${o.IdOrden || o.idOrden || o.id || 0}`,
              cliente: o.NombreUsuario || 
                      o.nombreUsuario || 
                      `Cliente ${o.IdUsuario || o.idUsuario || o.id || 0}`,
              total: o.Total !== null && o.Total !== undefined ? 
                    parseFloat(o.Total).toFixed(2) : 
                    (o.total ? parseFloat(o.total).toFixed(2) : '0.00'),
              fecha: o.FechaOrden ? 
                    new Date(o.FechaOrden).toLocaleDateString('es-ES') : 
                    (o.fechaOrden ? new Date(o.fechaOrden).toLocaleDateString('es-ES') : 'Fecha desconocida'),
              estado: o.status || o.Status || o.estado || 'Desconocido'
            };
          });
          break;
      }

      setData(processedData);
      setTotalItems(processedData.length);
      
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      alert(`Error al cargar los datos de ${activeTab}. Detalles: ${err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).map(v => `"${v}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    downloadFile(csv, `${activeTab}_export_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
  };

  const exportToJSON = () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    const jsonData = {
      metadata: {
        exportDate: new Date().toISOString(),
        tipo: activeTab,
        totalRegistros: data.length,
        sistema: 'EromodeShop Admin'
      },
      data: data
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    downloadFile(jsonString, `${activeTab}_export_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
  };

  const exportToXML = () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<${activeTab}>\n`;
    xml += '  <metadata>\n';
    xml += `    <exportDate>${new Date().toISOString()}</exportDate>\n`;
    xml += `    <tipo>${activeTab}</tipo>\n`;
    xml += `    <totalRegistros>${data.length}</totalRegistros>\n`;
    xml += '    <sistema>EromodeShop Admin</sistema>\n';
    xml += '  </metadata>\n';
    xml += '  <registros>\n';
    
    data.forEach(item => {
      xml += '    <registro>\n';
      Object.entries(item).forEach(([key, value]) => {
        xml += `      <${key}>${value}</${key}>\n`;
      });
      xml += '    </registro>\n';
    });
    
    xml += '  </registros>\n';
    xml += `</${activeTab}>`;
    
    downloadFile(xml, `${activeTab}_export_${new Date().toISOString().slice(0,10)}.xml`, 'text/xml');
  };

  const exportToPDF = () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    try {
      const doc = new jsPDF();
      
      // Título
      const title = `Reporte de ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
      const fecha = new Date().toLocaleDateString('es-ES');
      
      doc.setFontSize(16);
      doc.text(title, 14, 15);
      doc.setFontSize(10);
      doc.text(`Fecha: ${fecha}`, 14, 22);
      doc.text(`Total de registros: ${data.length}`, 14, 28);
      
      // Encabezados de tabla
      const headers = Object.keys(data[0]).map(key => 
        key.charAt(0).toUpperCase() + key.slice(1)
      );
      
      // Datos de la tabla
      const tableData = data.map(item => Object.values(item));
      
      // Crear tabla
      (doc as any).autoTable({
        startY: 35,
        head: [headers],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { top: 35 }
      });
      
      // Pie de página
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount} • EromodeShop Admin • Generado el: ${fecha}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Guardar PDF
      doc.save(`${activeTab}_reporte_${new Date().toISOString().slice(0,10)}.pdf`);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Asegúrate de tener jsPDF instalado.');
    }
  };

  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, activeTab);
      
      // Agregar metadata en una segunda hoja
      const metadata = [
        ['Sistema', 'EromodeShop Admin'],
        ['Fecha de exportación', new Date().toLocaleString('es-ES')],
        ['Tipo de datos', activeTab],
        ['Total de registros', data.length],
        ['', ''],
        ['Generado por', 'Panel Administrativo']
      ];
      const metadataSheet = XLSX.utils.aoa_to_sheet(metadata);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
      
      XLSX.writeFile(workbook, `${activeTab}_export_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error al generar el archivo Excel.');
    }
  };

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con conteos */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel Administrativo</h1>
          <p className="text-gray-600 mb-6">Gestión de usuarios, productos y ventas</p>
          
          {/* Cards de conteo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gradient-to- from-blue-500 to-blue-600 rounded-lg p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Usuarios Registrados</h3>
                  <p className="text-3xl font-bold mt-2">{conteo.usuarios}</p>
                </div>
                <Users size={40} className="opacity-80" />
              </div>
              <div className="mt-4 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <Database size={14} />
                  Base de datos actualizada
                </span>
              </div>
            </div>
            
            <div className="bg-gradient-to- from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Productos Activos</h3>
                  <p className="text-3xl font-bold mt-2">{conteo.productos}</p>
                </div>
                <Package size={40} className="opacity-80" />
              </div>
              <div className="mt-4 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <Database size={14} />
                  En inventario del sistema
                </span>
              </div>
            </div>
            
            <div className="bg-gradient-to- from-purple-500 to-purple-600 rounded-lg p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Ventas Totales</h3>
                  <p className="text-3xl font-bold mt-2">{conteo.ventas}</p>
                </div>
                <ShoppingCart size={40} className="opacity-80" />
              </div>
              <div className="mt-4 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <Database size={14} />
                  Órdenes procesadas
                </span>
              </div>
            </div>
          </div>
          
          {/* Resumen estadístico */}
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 text-gray-700">
              <BarChart3 size={20} />
              <span className="font-medium">Resumen del Sistema</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              <div className="text-center">
                <p className="text-sm text-gray-600">Usuarios activos</p>
                <p className="text-xl font-semibold">{conteo.usuarios}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Productos en stock</p>
                <p className="text-xl font-semibold">{conteo.productos}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Ventas totales</p>
                <p className="text-xl font-semibold">{conteo.ventas}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Exportaciones</p>
                <p className="text-xl font-semibold">5 formatos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => { setActiveTab('usuarios'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'usuarios' 
                  ? 'border-b-2 border-black text-black' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={20} />
              Usuarios
            </button>
            <button
              onClick={() => { setActiveTab('productos'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'productos' 
                  ? 'border-b-2 border-black text-black' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package size={20} />
              Productos
            </button>
            <button
              onClick={() => { setActiveTab('ventas'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'ventas' 
                  ? 'border-b-2 border-black text-black' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCart size={20} />
              Ventas Histórico
            </button>
          </div>

          {/* Export Buttons */}
          <div className="p-4 bg-gray-50 border-b flex gap-2 flex-wrap">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                title="Exportar como CSV"
              >
                <FileText size={18} />
                CSV
              </button>
              <button
                onClick={exportToJSON}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors shadow-sm"
                title="Exportar como JSON"
              >
                <FileJson size={18} />
                JSON
              </button>
              <button
                onClick={exportToXML}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                title="Exportar como XML"
              >
                <FileCode size={18} />
                XML
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                title="Exportar como PDF"
              >
                <Download size={18} />
                PDF
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                title="Exportar como Excel"
              >
                <FileSpreadsheet size={18} />
                Excel
              </button>
            </div>
            
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                title="Recargar datos"
              >
                <Download size={18} />
                Recargar
              </button>
              <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded border">
                <span className="font-medium">{data.length}</span> registros
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                <span className="ml-3 text-gray-600">Cargando datos...</span>
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Package size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600">No hay datos disponibles para {activeTab}</p>
                <p className="text-gray-500 text-sm mt-2">
                  Verifica la conexión con el backend o que existan registros
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    {data[0] && Object.keys(data[0]).map(key => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      {Object.values(item).map((value: any, i: number) => {
                        // Aplicar estilos especiales según el tipo de dato
                        const isPrecio = Object.keys(item)[i] === 'precio' || Object.keys(item)[i] === 'total';
                        const isStock = Object.keys(item)[i] === 'stock';
                        const isEstado = Object.keys(item)[i] === 'estado';
                        
                        let className = "px-6 py-4 whitespace-nowrap text-sm";
                        
                        if (isPrecio) {
                          className += " text-blue-600 font-medium";
                        } else if (isStock) {
                          className += value > 0 ? " text-green-600" : " text-red-600";
                        } else if (isEstado) {
                          const estadoClasses: {[key: string]: string} = {
                            'pendiente': 'bg-yellow-100 text-yellow-800',
                            'completado': 'bg-green-100 text-green-800',
                            'procesado': 'bg-blue-100 text-blue-800',
                            'cancelado': 'bg-red-100 text-red-800',
                            'entregado': 'bg-emerald-100 text-emerald-800'
                          };
                          const estadoClass = estadoClasses[value?.toLowerCase()] || 'bg-gray-100 text-gray-800';
                          className += ` px-3 py-1 rounded-full text-xs font-medium ${estadoClass}`;
                        } else {
                          className += " text-gray-900";
                        }
                        
                        return (
                          <td key={i} className={className}>
                            {isPrecio ? `$${value}` : value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
              <span className="font-medium">{totalItems}</span> resultados
            </div>
            <div className="flex gap-2">
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
                      className={`px-4 py-2 rounded-lg border transition-colors ${
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
        </div>

        {/* Link to Charts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <a
            href="/ventas"
            style={{ textDecoration: 'none' }}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to- from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <BarChart3 size={24} />
            <span className="text-lg font-semibold">Ver Gráficas y Análisis de Ventas</span>
          </a>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Exporta tus datos en 5 formatos diferentes: CSV, JSON, XML, PDF y Excel</p>
          </div>
        </div>
      </div>
    </div>
  );
}