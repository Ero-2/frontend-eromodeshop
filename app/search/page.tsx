'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  marca: { 
    idMarca: number;
    nombre: string 
  };
  inventarios: { talla: { nombreTalla: string }; stock: number }[];
  imagenes?: { idImagen: number; urlImagen: string; esPrincipal: boolean }[];
}

interface Marca {
  idMarca: number;
  nombre: string;
}

export default function SearchPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busquedaLocal, setBusquedaLocal] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productosRes, marcasRes] = await Promise.all([
          fetch('https://localhost:7220/api/productos'),
          fetch('https://localhost:7220/api/marcas')
        ]);
        
        if (!productosRes.ok) throw new Error('Error al cargar productos');
        if (!marcasRes.ok) throw new Error('Error al cargar marcas');
        
        const productosData = await productosRes.json();
        const marcasData = await marcasRes.json();
        
        const productosArray = Array.isArray(productosData) 
          ? productosData 
          : (productosData.value || productosData.productos || []);
        
        setProductos(productosArray);
        setMarcas(marcasData);
        
        // Establecer búsqueda desde URL
        if (query) {
          setBusquedaLocal(query);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(producto => {
    if (!query) return true;
    
    const termino = query.toLowerCase();
    return (
      producto.nombre.toLowerCase().includes(termino) ||
      producto.descripcion.toLowerCase().includes(termino) ||
      producto.marca?.nombre.toLowerCase().includes(termino)
    );
  });

  // Agrupar por marca para mostrar sugerencias
  const marcasEncontradas = productosFiltrados
    .map(p => p.marca?.nombre)
    .filter((nombre, index, self) => nombre && self.indexOf(nombre) === index);

  const agregarAlCarrito = (producto: Producto) => {
    const tallasDisponibles = producto.inventarios.filter(i => i.stock > 0);
    
    if (tallasDisponibles.length === 0) {
      alert('No hay stock disponible para este producto.');
      return;
    }

    const primeraTalla = tallasDisponibles[0].talla.nombreTalla;

    const item = {
      idProducto: producto.idProducto,
      nombre: producto.nombre,
      precio: producto.precio,
      talla: primeraTalla,
      cantidad: 1,
      imagen: producto.imagenes?.[0]?.urlImagen || ''
    };

    let carritoActual = JSON.parse(localStorage.getItem('carrito') || '[]');
    carritoActual.push(item);
    localStorage.setItem('carrito', JSON.stringify(carritoActual));
    
    alert(`✅ ${producto.nombre} agregado al carrito.`);
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (busquedaLocal.trim()) {
      router.push(`/search?q=${encodeURIComponent(busquedaLocal.trim())}`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* HEADER DE BÚSQUEDA */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/" 
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Volver al inicio"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold">Resultados de Búsqueda</h1>
        </div>
        
        {/* BARRA DE BÚSQUEDA */}
        <form onSubmit={handleBuscar} className="max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={busquedaLocal}
              onChange={(e) => setBusquedaLocal(e.target.value)}
              placeholder="Buscar productos, marcas..."
              className="w-full py-3 pl-12 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={24} />
            {busquedaLocal && (
              <button
                type="button"
                onClick={() => setBusquedaLocal('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="absolute right-16 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
            >
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* RESULTADOS */}
      {loading ? (
        <p className="text-center text-gray-600">Cargando resultados...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : (
        <>
          {/* INFORMACIÓN DE BÚSQUEDA */}
          <div className="mb-6">
            {query ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <h2 className="text-xl font-semibold">
                    {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? 's' : ''} para "{query}"
                  </h2>
                  
                  {/* SUGERENCIAS DE MARCAS */}
                  {marcasEncontradas.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm">Marcas encontradas:</span>
                      <div className="flex flex-wrap gap-2">
                        {marcasEncontradas.map((marca, index) => (
                          <button
                            key={index}
                            onClick={() => router.push(`/search?q=${encodeURIComponent(marca!)}`)}
                            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full transition"
                          >
                            {marca}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* SUGERENCIAS DE BÚSQUEDA RELACIONADA */}
                {productosFiltrados.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 mb-2">
                      No se encontraron resultados para "{query}". Intenta con:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['nike', 'zapatos', 'tenis', 'deportivos', 'casual'].map((sugerencia) => (
                        <button
                          key={sugerencia}
                          onClick={() => router.push(`/search?q=${sugerencia}`)}
                          className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full transition"
                        >
                          {sugerencia}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Search size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">¿Qué estás buscando?</h3>
                <p className="text-gray-500 mb-6">Escribe algo en la barra de búsqueda para encontrar productos.</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {['Nike Air Force', 'Reebok', 'Zapatos deportivos', 'Tenis casual', 'Calzado urbano'].map((sugerencia) => (
                    <button
                      key={sugerencia}
                      onClick={() => router.push(`/search?q=${encodeURIComponent(sugerencia)}`)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition"
                    >
                      {sugerencia}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LISTA DE PRODUCTOS ENCONTRADOS */}
          {productosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productosFiltrados.map((producto) => {
                const tallasDisponibles = producto.inventarios
                  ?.filter(i => i.stock > 0)
                  .map(i => i.talla.nombreTalla)
                  .join(', ') || 'Sin stock';

                return (
                  <div
                    key={producto.idProducto}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => router.push(`/producto/${producto.idProducto}`)}
                  >
                    <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                      {producto.imagenes && producto.imagenes.length > 0 ? (
                        <img
                          src={producto.imagenes[0].urlImagen}
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/placeholder-shoe.png'; 
                          }}
                        />
                      ) : (
                        <span className="text-gray-500">Sin imagen</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg">
                        {/* Resaltar término de búsqueda */}
                        {query && producto.nombre.toLowerCase().includes(query.toLowerCase()) ? (
                          <span>
                            {producto.nombre.split(new RegExp(`(${query})`, 'gi')).map((part, index) => 
                              part.toLowerCase() === query.toLowerCase() ? (
                                <mark key={index} className="bg-yellow-200 px-1">{part}</mark>
                              ) : (
                                part
                              )
                            )}
                          </span>
                        ) : (
                          producto.nombre
                        )}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{producto.descripcion}</p>
                      
                      <div className="mt-2">
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {producto.marca?.nombre || 'Sin marca'}
                        </span>
                      </div>
                      
                      <p className="text-blue-600 font-bold mt-2 text-lg">${producto.precio.toFixed(2)}</p>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                        <span>Tallas: {tallasDisponibles}</span>
                        <span>
                          Stock: {producto.inventarios?.reduce((sum, inv) => sum + inv.stock, 0) || 0}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          agregarAlCarrito(producto);
                        }}
                        className="mt-3 w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
                      >
                        Agregar al carrito
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}