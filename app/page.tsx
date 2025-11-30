// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  marca: { nombre: string };
  inventarios: { talla: { nombreTalla: string }; stock: number }[];
}

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        // ⚠️ Reemplaza el puerto por el de tu API .NET
        const res = await fetch('https://localhost:7008/api/productos');
        const data: Producto[] = await res.json();
        setProductos(data);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* BANNER GRANDE */}
      <div className="bg-gradient-to-r from-blue-900 to-black text-white rounded-xl p-12 mb-12 text-center shadow-lg">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">¡Nuevos Tenis Ya Disponibles!</h1>
        <p className="text-xl mb-6">Descubre las últimas tendencias en calzado urbano</p>
        <button className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition">
          Ver Colección
        </button>
      </div>

      {/* TÍTULO DE PRODUCTOS */}
      <h2 className="text-3xl font-bold text-center mb-8">Nuestros Tenis</h2>

      {/* LISTA DE PRODUCTOS */}
      {loading ? (
        <p className="text-center text-gray-600">Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p className="text-center text-gray-600">No hay productos disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((producto) => {
            const tallasDisponibles = producto.inventarios
              .filter(i => i.stock > 0)
              .map(i => i.talla.nombreTalla)
              .join(', ');

            return (
              <div key={producto.idProducto} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Imagen de {producto.nombre}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg">{producto.nombre}</h3>
                  <p className="text-gray-600 text-sm">{producto.descripcion}</p>
                  <p className="text-blue-600 font-bold mt-2">${producto.precio.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">Marca: {producto.marca.nombre}</p>
                  <p className="text-xs text-gray-500">Tallas: {tallasDisponibles || 'Sin stock'}</p>
                  <button className="mt-3 w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition">
                    Agregar al carrito
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}