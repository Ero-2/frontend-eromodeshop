'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

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

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<number | null>(null);
  const [loadingMarcas, setLoadingMarcas] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  // 👇 Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8; // Número de productos por página

  const router = useRouter();

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
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('No se pudieron cargar los datos');
      } finally {
        setLoading(false);
        setLoadingMarcas(false);
      }
    };

    fetchData();
  }, []);

  // Filtrar productos por marca seleccionada y búsqueda
  const productosFiltrados = productos.filter(producto => {
    // Filtro por marca
    const cumpleMarca = !marcaSeleccionada || producto.marca?.idMarca === marcaSeleccionada;
    
    // Filtro por búsqueda
    const cumpleBusqueda = !busqueda || 
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.marca?.nombre.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleMarca && cumpleBusqueda;
  });

  // 👇 Calcular productos para la página actual
  const totalItems = productosFiltrados.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Función para obtener productos paginados
  const getPaginatedProducts = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return productosFiltrados.slice(startIndex, endIndex);
  };

  const productosPaginados = getPaginatedProducts();

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

  const verColeccion = () => {
    const productosSection = document.getElementById('productos');
    if (productosSection) {
      productosSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const limpiarFiltro = () => {
    setMarcaSeleccionada(null);
    setCurrentPage(1); // 👈 Resetear a la primera página al limpiar filtros
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (busqueda.trim()) {
      // Redirigir a la página de búsqueda con el término
      router.push(`/search?q=${encodeURIComponent(busqueda.trim())}`);
    }
  };

  // 👇 Funciones de paginación
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* BANNER CON VIDEO */}
      <div className="relative rounded-xl mb-12 overflow-hidden shadow-lg h-[400px] md:h-[500px]">
        <div className="absolute inset-0 z-0">
          {!videoError ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Error loading video:', e);
                setVideoError(true);
              }}
              onLoadStart={() => console.log('Video loading...')}
              onCanPlay={() => console.log('Video can play')}
            >
              <source src="/videos/nike.mp4" type="video/mp4" />
              Tu navegador no soporta el elemento de video.
            </video>
          ) : (
            <div className="w-full h-full bg-gradient-to- from-blue-900 to-black"></div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        
        <div className="relative z-10 text-white h-full flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">¡Nuevos Tenis Ya Disponibles!</h1>
          <p className="text-xl md:text-2xl mb-8 drop-shadow-lg max-w-2xl">
            Descubre las últimas tendencias en calzado urbano
          </p>
          
          {/* BARRA DE BÚSQUEDA EN EL BANNER */}
          <form onSubmit={handleBuscar} className="w-full max-w-2xl mb-6">
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar productos, marcas..."
                className="w-full py-4 pl-12 pr-4 rounded-full bg-white/90 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={24} />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex gap-3 mt-3 justify-center">
              <button
                type="submit"
                className="bg-white text-black font-bold py-2 px-6 rounded-full hover:bg-gray-200 transition"
              >
                Buscar
              </button>
              <button 
                onClick={verColeccion}
                className="bg-transparent border-2 border-white text-white font-bold py-2 px-6 rounded-full hover:bg-white/20 transition"
              >
                Ver Colección
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 id="productos" className="text-3xl font-bold">Nuestros Tenis</h2>
          
          {/* Contador de resultados */}
          <div className="text-sm text-gray-600">
            {marcaSeleccionada || busqueda ? (
              <div className="flex items-center gap-2">
                <span>
                  Mostrando {productosFiltrados.length} de {productos.length} productos
                  {marcaSeleccionada && ` de ${marcas.find(m => m.idMarca === marcaSeleccionada)?.nombre}`}
                  {busqueda && ` para "${busqueda}"`}
                </span>
                {(marcaSeleccionada || busqueda) && (
                  <button 
                    onClick={() => {
                      setMarcaSeleccionada(null);
                      setBusqueda('');
                      setCurrentPage(1); // 👈 Resetear página
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    (Limpiar filtros)
                  </button>
                )}
              </div>
            ) : (
              <span>Mostrando todos los productos ({productos.length})</span>
            )}
          </div>
        </div>
        
        {/* FILTROS DE MARCAS */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Filtrar por marca:</h3>
          
          {loadingMarcas ? (
            <p className="text-gray-500">Cargando marcas...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={limpiarFiltro}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  marcaSeleccionada === null
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Todas ({productos.length})
              </button>
              
              {marcas.map((marca) => {
                const cantidadProductos = productos.filter(p => p.marca?.idMarca === marca.idMarca).length;
                if (cantidadProductos === 0) return null;
                
                return (
                  <button
                    key={marca.idMarca}
                    onClick={() => {
                      setMarcaSeleccionada(marca.idMarca);
                      setCurrentPage(1); // 👈 Resetear página al cambiar marca
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      marcaSeleccionada === marca.idMarca
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {marca.nombre} ({cantidadProductos})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* LISTA DE PRODUCTOS */}
      {loading ? (
        <p className="text-center text-gray-600">Cargando productos...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">
            {busqueda 
              ? `No se encontraron resultados para "${busqueda}"`
              : marcaSeleccionada 
                ? `No hay productos disponibles de la marca "${marcas.find(m => m.idMarca === marcaSeleccionada)?.nombre}"`
                : 'No hay productos disponibles.'}
          </p>
          {(marcaSeleccionada || busqueda) && (
            <button
              onClick={() => {
                setMarcaSeleccionada(null);
                setBusqueda('');
                setCurrentPage(1); // 👈 Resetear página
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Ver todos los productos
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Información del filtro aplicado */}
          {(marcaSeleccionada || busqueda) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-700">
                {marcaSeleccionada && `Marca: ${marcas.find(m => m.idMarca === marcaSeleccionada)?.nombre} • `}
                {busqueda && `Búsqueda: "${busqueda}" • `}
                Resultados: <span className="font-bold">{productosFiltrados.length}</span> productos
              </p>
            </div>
          )}

          {/* Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productosPaginados.map((producto) => {
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
                    <h3 className="font-bold text-lg">{producto.nombre}</h3>
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

          {/* 👇 COMPONENTE DE PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-black border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Anterior
              </button>

              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-black border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}