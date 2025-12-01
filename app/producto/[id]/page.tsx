'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  marca: { nombre: string };
  inventarios: { talla: { nombreTalla: string }; stock: number }[];
  imagenes: { idImagen: number; urlImagen: string; esPrincipal: boolean }[];
}

export default function ProductoPage() {
  const { id } = useParams();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTalla, setSelectedTalla] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [imagenActual, setImagenActual] = useState(0);
  const [imageError, setImageError] = useState<{[key: number]: boolean}>({});

  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    const fetchProducto = async () => {
      try {
        const res = await fetch(`https://localhost:7220/api/productos/${id}`);
        
        if (!res.ok) {
          throw new Error('Producto no encontrado');
        }
        
        const data = await res.json();
        setProducto(data);
      } catch (err) {
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProducto();
  }, [id]);

  if (loading) {
    return <p className="text-center mt-12">Cargando producto...</p>;
  }

  if (error || !producto) {
    return <p className="text-center mt-12 text-red-600">{error || 'Producto no encontrado'}</p>;
  }

  const tallasDisponibles = producto.inventarios.filter(i => i.stock > 0);

  const handleAgregarAlCarrito = () => {
    if (!selectedTalla) {
      alert('Por favor selecciona una talla');
      return;
    }

    const item = {
      idProducto: producto.idProducto,
      nombre: producto.nombre,
      precio: producto.precio,
      talla: selectedTalla,
      cantidad: cantidad,
      imagen: producto.imagenes[0]?.urlImagen || ''
    };

    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    carrito.push(item);
    localStorage.setItem('carrito', JSON.stringify(carrito));

    alert('Producto agregado al carrito');
    router.push('/carrito');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <nav className="text-sm mb-4">
        <a href="/" className="text-blue-600 hover:underline">Inicio</a> &gt; 
        <span className="ml-1">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Galería de imágenes */}
        <div className="space-y-4">
          <div className="h-96 bg-gray-200 rounded-lg overflow-hidden">
            {producto.imagenes && producto.imagenes.length > 0 ? (
              <img
                src={producto.imagenes[imagenActual]?.urlImagen || producto.imagenes[0]?.urlImagen}
                alt={producto.nombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Error cargando imagen:', producto.imagenes[imagenActual]?.urlImagen);
                  setImageError(prev => ({...prev, [imagenActual]: true}));
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Sin imagen
              </div>
            )}
            {imageError[imagenActual] && (
              <div className="flex flex-col items-center justify-center h-full bg-gray-300 text-gray-600 p-4">
                <p className="font-semibold">Error al cargar imagen</p>
                <p className="text-sm mt-2 break-all">{producto.imagenes[imagenActual]?.urlImagen}</p>
              </div>
            )}
          </div>
          
          {/* Miniaturas - AQUÍ ESTABA EL ERROR */}
          {producto.imagenes && producto.imagenes.length > 1 && (
            <div className="flex space-x-2">
              {producto.imagenes.map((img, index) => (
                <div 
                  key={img.idImagen} 
                  className={`w-16 h-16 bg-gray-200 rounded cursor-pointer border-2 ${
                    imagenActual === index ? 'border-blue-600' : 'border-transparent'
                  }`}
                  onClick={() => setImagenActual(index)}
                >
                  <img
                    src={img.urlImagen} // ✅ CORRECTO: Usa img.urlImagen, no producto.imagenes[0]
                    alt={`${producto.nombre} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detalles del producto */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>
          <p className="text-gray-600 mb-4">{producto.descripcion}</p>
          <p className="text-2xl font-bold text-blue-600 mb-4">${producto.precio.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mb-4">Marca: {producto.marca.nombre}</p>

          {/* Selección de talla */}
          <div className="mb-4">
            <label className="block font-semibold mb-2">Selecciona talla:</label>
            <select
              value={selectedTalla || ''}
              onChange={(e) => setSelectedTalla(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Selecciona --</option>
              {tallasDisponibles.map((inv) => (
                <option key={inv.talla.nombreTalla} value={inv.talla.nombreTalla}>
                  {inv.talla.nombreTalla} ({inv.stock} disponibles)
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="mb-4">
            <label className="block font-semibold mb-2">Cantidad:</label>
            <input
              type="number"
              min="1"
              max={selectedTalla ? tallasDisponibles.find(t => t.talla.nombreTalla === selectedTalla)?.stock : 1}
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Math.min(Number(e.target.value), 99)))}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Botón agregar al carrito */}
          <button
            onClick={handleAgregarAlCarrito}
            className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 flex items-center justify-center gap-2"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}