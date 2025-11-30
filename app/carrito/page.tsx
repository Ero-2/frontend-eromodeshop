'use client';

import { useEffect, useState } from 'react';

interface CarritoItem {
  idCarrito: number;
  idProducto: number;
  nombreProducto: string;
  talla: string;
  cantidad: number;
  precioUnitario: number;
  stockDisponible: number;
}

export default function CarritoPage() {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarrito = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión');
        return;
      }

      try {
        const res = await fetch('https://localhost:7008/api/carrito', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCarrito(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarrito();
  }, []);

  const eliminarItem = async (idCarrito: number) => {
    const token = localStorage.getItem('token');
    await fetch(`https://localhost:7008/api/carrito/${idCarrito}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setCarrito(carrito.filter(item => item.idCarrito !== idCarrito));
  };

  const total = carrito.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);

  if (loading) return <p className="text-center mt-12">Cargando carrito...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8">
      <h1 className="text-2xl font-bold mb-6">Carrito de Compras</h1>
      {carrito.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <div>
          <div className="space-y-4">
            {carrito.map((item) => (
              <div key={item.idCarrito} className="flex justify-between items-center p-4 border rounded">
                <div>
                  <h3>{item.nombreProducto}</h3>
                  <p>Talla: {item.talla} | Cantidad: {item.cantidad}</p>
                </div>
                <div className="text-right">
                  <p>${(item.precioUnitario * item.cantidad).toFixed(2)}</p>
                  <button
                    onClick={() => eliminarItem(item.idCarrito)}
                    className="text-red-500 mt-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-right">
            <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
            <button className="mt-4 bg-green-600 text-white px-6 py-2 rounded">
              Proceder al Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}