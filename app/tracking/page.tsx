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

const PIPELINE: Record<string, { nombre: string; color: string; icono: string }> = {
  pendiente: { nombre: 'Pendiente', color: 'bg-yellow-500', icono: 'far fa-clock' },
  preparando: { nombre: 'En preparación', color: 'bg-blue-500', icono: 'fas fa-box-open' },
  revisado: { nombre: 'Revisado', color: 'bg-purple-500', icono: 'fas fa-check-double' },
  liberado: { nombre: 'Liberado', color: 'bg-green-500', icono: 'fas fa-check-circle' },
  entregado: { nombre: 'Entregado', color: 'bg-teal-600', icono: 'fas fa-truck' },
  cancelado: { nombre: 'Cancelado', color: 'bg-red-500', icono: 'fas fa-times-circle' }
};

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
                            <i className={`${detalle.iconoEstado} text-2xl text-white`}></i>
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
                              className={`px-4 py-2 rounded-lg text-sm font-semibold ${detalle.colorEstado} text-white`}
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