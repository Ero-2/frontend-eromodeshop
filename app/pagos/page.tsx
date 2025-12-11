'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package, Clock, CheckCircle } from 'lucide-react';

interface OrdenResumen {
  IdOrden: number;
  Total: number;
  FechaOrden: string; // ISO string
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
}

export default function MisPedidosPage() {
  const [ordenes, setOrdenes] = useState<OrdenResumen[]>([]);
  const [detalles, setDetalles] = useState<DetalleOrden[]>([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Cargar lista de órdenes al montar
  useEffect(() => {
    const cargarOrdenes = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('https://localhost:7220/api/orden', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setOrdenes(data);
        } else {
          const err = await res.json();
          setError(err.error || 'No se pudieron cargar tus pedidos.');
        }
      } catch (err) {
        setError('Error de conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    cargarOrdenes();
  }, [router]);

  // Cargar detalles de una orden específica
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
      const res = await fetch(`https://localhost:7220/api/orden/${id}/detalles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDetalles(data);
      } else {
        const err = await res.json();
        setError(err.error || 'No se pudieron cargar los detalles.');
        setDetalles([]);
      }
    } catch (err) {
      setError('Error al cargar los detalles del pedido.');
      setDetalles([]);
    } finally {
      setLoadingDetalles(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Loader2 className="animate-spin text-gray-600" size={32} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
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
          {ordenes.map((orden) => (
            <div key={orden.IdOrden} className="border rounded-xl overflow-hidden shadow-sm">
              <div
                className="bg-white p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
                onClick={() => verDetalles(orden.IdOrden)}
              >
                <div>
                  <h3 className="text-lg font-semibold">Pedido #{orden.IdOrden}</h3>
                  <p className="text-gray-600 text-sm">
                    {new Date(orden.FechaOrden).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${(orden.Total ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ordenSeleccionada === orden.IdOrden ? 'Ocultar detalles' : 'Ver detalles'}
                  </p>
                </div>
              </div>

              {/* Panel de detalles */}
              {ordenSeleccionada === orden.IdOrden && (
                <div className="bg-gray-50 p-5 border-t">
                  {loadingDetalles ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin text-gray-500" size={24} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {detalles.length > 0 ? (
                        detalles.map((detalle) => (
                          <div
                            key={detalle.idDetalleOrden}
                            className="flex items-start justify-between p-3 bg-white rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{detalle.producto}</p>
                              <p className="text-sm text-gray-600">
                                Talla: {detalle.talla} • Cantidad: {detalle.cantidad}
                              </p>
                              <p className="text-sm text-gray-500">
                                Precio: ${(detalle.precioUnitario ?? 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold">${(detalle.subtotal ?? 0).toFixed(2)}</p>
                              <span
                                className="inline-block px-2 py-1 text-xs rounded-full mt-1"
                                style={{
                                  backgroundColor: (detalle.colorEstado || '#9CA3AF') + '30',
                                  color: detalle.colorEstado || '#4B5563'
                                }}
                              >
                                {detalle.nombreEstado || detalle.status}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No hay productos en este pedido.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}