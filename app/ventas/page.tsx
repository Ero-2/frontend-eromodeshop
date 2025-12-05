'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, ShoppingBag, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface VentaPublica {
  nombreProducto: string;
  marca: string;
  talla: string;
  cantidad: number;
  precioUnitario: number;
  totalProducto: number;
  fechaOrden: string;
}

export default function PaginaVentasPublica() {
  const [ventas, setVentas] = useState<VentaPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroMarca, setFiltroMarca] = useState<string>('todas');
  const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'total'>('fecha');
  const [resumen, setResumen] = useState({
    totalVentas: 0,
    productosVendidos: 0,
    ingresoTotal: 0,
    ventasHoy: 0
  });

  const router = useRouter();

  useEffect(() => {
    const cargarVentas = async () => {
      try {
        console.log('🔄 Cargando ventas desde API...');
        
        // ⭐ Llamada DIRECTA a tu API de .NET (igual que en checkout)
        // Usar HTTP si tu API corre en HTTP, HTTPS si corre en HTTPS
        const response = await fetch('https://localhost:7220/api/HechoVentas', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        
        console.log('📊 Status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error:', errorText);
          throw new Error(`Error ${response.status}: No se pudieron cargar las ventas`);
        }

        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setVentas(data);
          
          // Calcular resumen
          const hoy = new Date().toISOString().split('T')[0];
          const ventasHoy = data.filter(v => 
            v.fechaOrden && v.fechaOrden.split('T')[0] === hoy
          ).length;
          
          const totalVentas = data.length;
          const productosVendidos = data.reduce((sum, v) => sum + (v.cantidad || 0), 0);
          const ingresoTotal = data.reduce((sum, v) => sum + (v.totalProducto || 0), 0);
          
          setResumen({
            totalVentas,
            productosVendidos,
            ingresoTotal,
            ventasHoy
          });
          
          console.log('📈 Resumen calculado:', { totalVentas, productosVendidos, ingresoTotal, ventasHoy });
        } else if (Array.isArray(data) && data.length === 0) {
          console.log('ℹ️ No hay ventas registradas');
          setVentas([]);
        } else {
          throw new Error('Formato de datos inválido recibido del servidor');
        }
      } catch (err: any) {
        console.error('❌ Error completo:', err);
        setError(err.message || 'Error desconocido al cargar las ventas');
      } finally {
        setLoading(false);
      }
    };

    cargarVentas();
  }, []);

  // Obtener marcas únicas para filtro
  const marcasUnicas = ['todas', ...new Set(ventas.map(v => v.marca).filter(Boolean))];

  // Filtrar y ordenar ventas
  const ventasFiltradas = ventas
    .filter(v => filtroMarca === 'todas' || v.marca === filtroMarca)
    .sort((a, b) => {
      if (ordenarPor === 'fecha') {
        return new Date(b.fechaOrden).getTime() - new Date(a.fechaOrden).getTime();
      } else {
        return b.totalProducto - a.totalProducto;
      }
    });

  const formatearFecha = (fechaISO: string) => {
    if (!fechaISO) return 'Fecha no disponible';
    
    try {
      const fecha = new Date(fechaISO);
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);
      
      if (fecha.toDateString() === hoy.toDateString()) {
        return 'Hoy';
      } else if (fecha.toDateString() === ayer.toDateString()) {
        return 'Ayer';
      }
      
      return fecha.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fechaISO;
    }
  };

  const formatearHora = (fechaISO: string) => {
    if (!fechaISO) return '';
    
    try {
      return new Date(fechaISO).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const buscarProductos = (termino: string) => {
    router.push(`/search?q=${encodeURIComponent(termino)}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center gap-4 mb-8">
          <div className="animate-pulse bg-gray-200 rounded-full w-10 h-10"></div>
          <div className="animate-pulse bg-gray-200 rounded h-8 w-48"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/" 
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Volver a la tienda"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <TrendingUp className="text-green-600" size={28} />
              Últimas Ventas
            </h1>
            <p className="text-gray-600 mt-1">
              Productos recién vendidos en Ero Mode Shop
            </p>
          </div>
        </div>

        {/* RESÚMEN */}
        {!error && ventas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag className="text-blue-500" size={24} />
                <h3 className="text-lg font-semibold">Total Ventas</h3>
              </div>
              <p className="text-2xl font-bold">{resumen.totalVentas}</p>
              <p className="text-sm text-gray-500 mt-1">Transacciones realizadas</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag className="text-green-500" size={24} />
                <h3 className="text-lg font-semibold">Productos Vendidos</h3>
              </div>
              <p className="text-2xl font-bold">{resumen.productosVendidos}</p>
              <p className="text-sm text-gray-500 mt-1">Unidades totales</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="text-purple-500" size={24} />
                <h3 className="text-lg font-semibold">Ingreso Total</h3>
              </div>
              <p className="text-2xl font-bold">${resumen.ingresoTotal.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Monto generado</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="text-orange-500" size={24} />
                <h3 className="text-lg font-semibold">Ventas Hoy</h3>
              </div>
              <p className="text-2xl font-bold">{resumen.ventasHoy}</p>
              <p className="text-sm text-gray-500 mt-1">En las últimas 24h</p>
            </div>
          </div>
        )}
      </div>

      <button
  onClick={async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/https://localhost:7220/api/sincronizar/ventas', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    alert(data.mensaje || data.error || 'Error desconocido');
    if (res.ok) {
      window.location.reload(); // Recargar para ver los nuevos datos
    }
  }}
  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium mt-4"
>
  🔄 Sincronizar Ventas 
</button>

      {/* CONTENIDO PRINCIPAL */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-red-700 mb-2">⚠️ Error al cargar ventas</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="bg-white border border-red-200 rounded p-4 mb-4 text-left text-sm">
            <p className="font-semibold mb-2">Posibles soluciones:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Verifica que tu API de .NET esté corriendo en https://localhost:7220</li>
              <li>Asegúrate de que la ruta sea: https://localhost:7220/api/HechoVentas</li>
              <li>Revisa la consola del navegador para más detalles (F12)</li>
              <li>Verifica que CORS esté habilitado en tu API de .NET</li>
              <li>Si usas HTTPS, acepta el certificado autofirmado en tu navegador</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            🔄 Reintentar
          </button>
        </div>
      ) : ventas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay ventas registradas</h3>
          <p className="text-gray-500 mb-6">
            Aún no se han realizado ventas en la tienda.
          </p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <>
          {/* FILTROS */}
          <div className="bg-white rounded-lg shadow p-4 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por marca
                  </label>
                  <select
                    value={filtroMarca}
                    onChange={(e) => setFiltroMarca(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {marcasUnicas.map((marca) => (
                      <option key={marca} value={marca}>
                        {marca === 'todas' ? 'Todas las marcas' : marca}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordenar por
                  </label>
                  <select
                    value={ordenarPor}
                    onChange={(e) => setOrdenarPor(e.target.value as 'fecha' | 'total')}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fecha">Más recientes</option>
                    <option value="total">Mayor monto</option>
                  </select>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">
                  Mostrando {ventasFiltradas.length} de {ventas.length} ventas
                </p>
                {filtroMarca !== 'todas' && (
                  <button
                    onClick={() => setFiltroMarca('todas')}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LISTA DE VENTAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ventasFiltradas.slice(0, 12).map((venta, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="p-6">
                  {/* HEADER DE VENTA */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          new Date(venta.fechaOrden).toDateString() === new Date().toDateString()
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatearFecha(venta.fechaOrden)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatearHora(venta.fechaOrden)}
                        </span>
                      </div>

                      
                      
                      <h3 
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                        onClick={() => buscarProductos(venta.nombreProducto)}
                        title="Buscar productos similares"
                      >
                        {venta.nombreProducto}
                      </h3>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {venta.marca || 'Sin marca'}
                        </span>
                        <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          Talla {venta.talla}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${venta.totalProducto.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${venta.precioUnitario.toFixed(2)} c/u
                      </div>
                    </div>
                  </div>

                  {/* DETALLES */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Cantidad</div>
                        <div className="text-lg font-semibold">{venta.cantidad}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Precio Unitario</div>
                        <div className="text-lg font-semibold">${venta.precioUnitario.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Subtotal</div>
                        <div className="text-lg font-semibold">${venta.totalProducto.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => buscarProductos(venta.nombreProducto)}
                        className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={18} />
                        Buscar productos similares
                      </button>
                    </div>
                  </div>
                  
                  {/* INFO ADICIONAL */}
                  <div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
                    <span>ID: #{index + 1}</span>
                    <span className="text-gray-400">
                      Vendido {formatearFecha(venta.fechaOrden)} • {formatearHora(venta.fechaOrden)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PIE DE PÁGINA */}
          <div className="mt-12 bg-gray-50 rounded-lg p-6 text-center">
            <div className="max-w-2xl mx-auto">
              <h4 className="font-semibold text-lg mb-3">📈 Ventas en tiempo real</h4>
              <p className="text-gray-600 mb-4">
                Las ventas mostradas se actualizan automáticamente desde nuestra tienda.
                Los datos reflejan transacciones reales realizadas por nuestros clientes.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                  <span className="text-sm text-gray-500">Total registros:</span>
                  <span className="ml-2 font-semibold">{ventas.length}</span>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                  <span className="text-sm text-gray-500">Marcas:</span>
                  <span className="ml-2 font-semibold">{marcasUnicas.length - 1}</span>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                  <span className="text-sm text-gray-500">Última actualización:</span>
                  <span className="ml-2 font-semibold">
                    {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}