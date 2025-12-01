'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus } from 'lucide-react';

// Interfaz para un artículo del carrito (ajustada para claridad)
interface CarritoItem {
  idProducto: number;
  nombre: string;
  precio: number;
  talla: string;
  cantidad: number;
  imagen: string; // Puede ser URL completa o relativa
}

export default function CarritoPage() {
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('carrito');
    if (stored) {
      const parsed: CarritoItem[] = JSON.parse(stored);
      setCarrito(parsed);
      const total = parsed.reduce((sum: number, item: CarritoItem) => sum + item.precio * item.cantidad, 0);
      setTotal(total);
    }
  }, []);

  // Función para actualizar la cantidad de un item
  const actualizarCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;

    const nuevoCarrito = [...carrito];
    nuevoCarrito[index].cantidad = nuevaCantidad;
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    const total = nuevoCarrito.reduce((sum: number, item: CarritoItem) => sum + item.precio * item.cantidad, 0);
    setTotal(total);
  };

  // Función para eliminar un item
  const eliminarItem = (index: number) => {
    const nuevoCarrito = carrito.filter((_, i) => i !== index);
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    const total = nuevoCarrito.reduce((sum: number, item: CarritoItem) => sum + item.precio * item.cantidad, 0);
    setTotal(total);
  };

  // Función para ir a checkout
  const irACheckout = () => {
    if (carrito.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }
    router.push('/checkout');
  };

  // Función para agregar al carrito (modificada)
  const agregarAlCarrito = (item: CarritoItem) => {
    const nuevoCarrito = [...carrito];

    // Buscar si ya existe el producto con la misma talla
    const existingIndex = nuevoCarrito.findIndex(
      (i) => i.idProducto === item.idProducto && i.talla === item.talla
    );

    if (existingIndex > -1) {
      // Si existe, suma la cantidad
      nuevoCarrito[existingIndex].cantidad += item.cantidad;
    } else {
      // Si no existe, añade el item
      nuevoCarrito.push(item);
    }

    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));

    // Actualizar total
    const total = nuevoCarrito.reduce((sum: number, item: CarritoItem) => sum + item.precio * item.cantidad, 0);
    setTotal(total);

    alert(`✅ ${item.nombre} actualizado en el carrito.`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Mi Carrito</h1>

      {carrito.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">Tu carrito está vacío</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Seguir comprando
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {carrito.map((item, index) => {
              // ⭐ LÓGICA DE CORRECCIÓN DE URL
              // Si la URL es relativa (no empieza con http), le añadimos el prefijo de la API.
              const imagenUrlCompleta = item.imagen && !item.imagen.startsWith('http')
                  ? `https://localhost:7220${item.imagen}`
                  : item.imagen;
              
              return (
                <div key={index} className="flex items-center gap-4 p-4 border rounded">
                  {/* Imagen del producto */}
                  <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden">
                    <img
                      src={imagenUrlCompleta} // ✅ Usar la URL que aseguramos que es completa
                      alt={item.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                          // ✅ SOLUCIÓN AL ERROR 404
                          // 1. Evitar bucles infinitos de error.
                          e.currentTarget.onerror = null; 
                          // 2. Usar un placeholder público que no requiere archivos en /public
                          e.currentTarget.src = 'https://via.placeholder.com/80x80?text=Sin+Imagen  '; 
                          console.error('Error cargando imagen:', item.imagen);
                      }}
                    />
                  </div>

                  {/* Detalles del producto */}
                  <div className="flex-1">
                    <h3 className="font-bold">{item.nombre}</h3>
                    <p className="text-sm text-gray-600">Talla: {item.talla}</p>
                    <p className="text-blue-600 font-bold">${item.precio.toFixed(2)} x {item.cantidad}</p>
                  </div>

                  {/* Controles de cantidad y eliminar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => actualizarCantidad(index, item.cantidad - 1)}
                      className="p-1 bg-gray-200 rounded"
                    >
                      <Minus size={16} />
                    </button>
                    <span>{item.cantidad}</span>
                    <button
                      onClick={() => actualizarCantidad(index, item.cantidad + 1)}
                      className="p-1 bg-gray-200 rounded"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => eliminarItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4 flex justify-between items-center">
            <div className="text-xl font-bold">Total: ${total.toFixed(2)}</div>
            <button
              onClick={irACheckout}
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
            >
              Finalizar Compra
            </button>
          </div>
        </>
      )}
    </div>
  );
}