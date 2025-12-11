'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Orden {
  idOrden: number;
  total: number;
  fechaOrden: string;
}

interface DetalleOrden {
  idDetalleOrden: number;
  producto: string;
  talla: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  status: string;
  nombreEstado: string;
  colorEstado: string;
  iconoEstado: string;
  progreso: number;
}

export default function MisPedidosPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<number | null>(null);
  const [detalles, setDetalles] = useState<DetalleOrden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  // 👇 Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Órdenes por página

  const router = useRouter();

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Debes iniciar sesión para ver tus pedidos');
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('https://localhost:7220/api/Orden', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setOrdenes(data);
      } else if (res.status === 401) {
        localStorage.removeItem('token');
        alert('Tu sesión ha expirado');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      alert('Error al cargar tus pedidos');
    } finally {
      setCargando(false);
    }
  };

  const cargarDetalles = async (idOrden: number) => {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    setCargandoDetalles(true);
    setOrdenSeleccionada(idOrden);

    try {
      const res = await fetch(`https://localhost:7220/api/Orden/${idOrden}/detalles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setDetalles(data);
      } else {
        alert('Error al cargar los detalles');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargandoDetalles(false);
    }
  };

  // 👇 Lógica de paginación
  const totalItems = ordenes.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const ordenesPaginadas = ordenes.slice(startIndex, startIndex + pageSize);

  if (cargando) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-xl">Cargando tus pedidos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mis Pedidos</h1>
        <p className="text-gray-600 text-lg">Seguimiento de tus compras</p>
      </div>

      {ordenes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <i className="fas fa-shopping-bag text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No tienes pedidos</h2>
          <p className="text-gray-600 mb-6">Cuando realices una compra, aparecerá aquí</p>
          <button
            onClick={() => router.push('/')}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Ir a la tienda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Órdenes */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tus Órdenes</h2>
            {ordenesPaginadas.map((orden) => (
              <button
                key={orden.idOrden}
                onClick={() => cargarDetalles(orden.idOrden)}
                className={`w-full text-left border rounded-xl p-5 transition-all ${
                  ordenSeleccionada === orden.idOrden
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:shadow-md hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      Orden #{orden.idOrden}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(orden.fechaOrden).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    ${orden.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600 font-medium">
                    Ver detalles →
                  </span>
                </div>
              </button>
            ))}

            {/* 👇 Componente de Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Anterior
                </button>

                <span className="text-sm text-gray-600">
                  {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          {/* Detalles de la Orden Seleccionada */}
          <div className="lg:col-span-2">
            {!ordenSeleccionada ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <i className="fas fa-hand-pointer text-6xl text-gray-300 mb-4"></i>
                <p className="text-xl text-gray-600">
                  Selecciona una orden para ver sus detalles
                </p>
              </div>
            ) : cargandoDetalles ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-xl text-gray-600">Cargando detalles...</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-5">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Orden #{ordenSeleccionada}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {detalles.length} producto{detalles.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {detalles.map((detalle) => (
                    <div
                      key={detalle.idDetalleOrden}
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icono de estado */}
                        <div className="shrink-0">
                          <div
                            className={`w-14 h-14 rounded-full ${detalle.colorEstado} flex items-center justify-center shadow-sm`}
                          >
                            {/* Usar un ícono simple si no tienes Font Awesome */}
                            {detalle.iconoEstado === 'Clock' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {detalle.iconoEstado === 'Package' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 6l-8 4m8-4v10l-8 4m0-10L4 13m0 0v10l8 4" />
                              </svg>
                            )}
                            {detalle.iconoEstado === 'Eye' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                            {detalle.iconoEstado === 'Truck' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17l6-6m0 6l-6-6m6 6H8v-6h6v6z" />
                              </svg>
                            )}
                            {detalle.iconoEstado === 'CheckCircle' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 6v-6a3 3 0 00-5.356-1.857M18 17M18 17V9m0 8h-2.556A4.444 4.444 0 0112 15.556V11" />
                              </svg>
                            )}
                            {detalle.iconoEstado === 'CreditCard' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18v6H3v-6z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10v6M18 10v6" />
                              </svg>
                            )}
                            {detalle.iconoEstado === 'XCircle' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-7a4 4 0 11-5.656 5.656L10 14M7 7a4 4 0 015.656 5.656L16 9" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {detalle.producto}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                <span>Talla: {detalle.talla}</span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span>{detalle.cantidad} uds</span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="font-semibold text-gray-900">
                                  ${detalle.precioUnitario.toFixed(2)} c/u
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-lg text-gray-900">
                              ${detalle.subtotal.toFixed(2)}
                            </span>
                          </div>

                          {/* Badge de estado */}
                          <div className="flex items-center gap-3 mb-3">
                            <span
                              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${detalle.colorEstado}`}
                            >
                              {detalle.nombreEstado}
                            </span>
                          </div>

                          {/* Barra de progreso */}
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                              <span className="font-medium">Progreso del pedido</span>
                              <span className="font-semibold text-gray-900">
                                {detalle.progreso}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300 bg-gray-800"
                                style={{ width: `${detalle.progreso}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}