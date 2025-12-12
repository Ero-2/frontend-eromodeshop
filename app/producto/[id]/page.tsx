'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShoppingCartIcon, 
  StarIcon, 
  XMarkIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

// Modelos
interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  marca: { nombre: string };
  inventarios: { talla: { nombreTalla: string }; stock: number }[];
  imagenes: { idImagen: number; urlImagen: string; esPrincipal: boolean }[];
}

interface Resena {
  idResena: number;
  idProducto: number;
  idUsuario: number;
  calificacion: number;
  comentario: string | null;
  fecha: string;
  aprobada: boolean;
  respuestaAdmin: string | null;
  usuario: {
    nombre: string;
    apellido: string;
  };
}

export default function ProductoPage() {
  const { id } = useParams();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [reseñas, setReseñas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReseñas, setLoadingReseñas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTalla, setSelectedTalla] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [imagenActual, setImagenActual] = useState(0);
  const [imageError, setImageError] = useState<{[key: number]: boolean}>({});

  // Estado para el modal de reseña
  const [showModal, setShowModal] = useState(false);
  const [nuevaReseña, setNuevaReseña] = useState({ 
    calificacion: 5, 
    comentario: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  const router = useRouter();

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const checkAuth = () => {
      // Intenta con ambas claves posibles
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (token) {
        setIsAuthenticated(true);
        
        // Intentar obtener el nombre del usuario del token
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          if (tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']) {
            setUserName(tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']);
          } else if (tokenPayload.name) {
            setUserName(tokenPayload.name);
          }
        } catch (e) {
          console.log('No se pudo decodificar el token:', e);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setCheckingAuth(false);
    };

    checkAuth();
    
    // También escuchar cambios en localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Cargar producto y reseñas
  useEffect(() => {
    if (!id) return;

    const fetchProducto = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`https://localhost:7220/api/productos/${id}`, {
          headers
        });
        
        if (!res.ok) throw new Error('Producto no encontrado');
        const data = await res.json();
        setProducto(data);
      } catch (err) {
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    const fetchReseñas = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`https://localhost:7220/api/resenas/producto/${id}`, {
          headers
        });
        
        if (res.ok) {
          const data = await res.json();
          setReseñas(data);
        }
      } catch (err) {
        console.error('Error cargando reseñas:', err);
      } finally {
        setLoadingReseñas(false);
      }
    };

    fetchProducto();
    fetchReseñas();
  }, [id]);

  const handleAgregarAlCarrito = () => {
    if (!selectedTalla) {
      alert('Por favor selecciona una talla');
      return;
    }

    const item = {
      idProducto: producto!.idProducto,
      nombre: producto!.nombre,
      precio: producto!.precio,
      talla: selectedTalla,
      cantidad: cantidad,
      imagen: producto!.imagenes[0]?.urlImagen || ''
    };

    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    carrito.push(item);
    localStorage.setItem('carrito', JSON.stringify(carrito));

    alert('Producto agregado al carrito');
    router.push('/carrito');
  };

  const abrirModalReseña = () => {
    if (!isAuthenticated) {
      // Mostrar alerta y redirigir al login
      if (confirm('Para dejar una reseña necesitas iniciar sesión. ¿Quieres ir a la página de inicio de sesión?')) {
        router.push('/login');
      }
      return;
    }
    setShowModal(true);
    setModalError(null);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setNuevaReseña({ calificacion: 5, comentario: '' });
    setModalError(null);
  };

  const handleEnviarReseña = async () => {
    // Obtener token de ambas fuentes posibles
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    if (!token) {
      setModalError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      setIsAuthenticated(false);
      return;
    }

    if (!nuevaReseña.comentario.trim()) {
      setModalError('Por favor escribe un comentario.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch('https://localhost:7220/api/resenas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          idProducto: producto!.idProducto,
          calificacion: nuevaReseña.calificacion,
          comentario: nuevaReseña.comentario.trim()
        })
      });

      if (res.ok) {
        const nuevaReseñaCreada = await res.json();
        alert('¡Reseña enviada con éxito!');
        
        // Actualizar la lista de reseñas localmente
        setReseñas(prev => [{
          ...nuevaReseñaCreada,
          usuario: {
            nombre: userName || 'Usuario',
            apellido: ''
          }
        }, ...prev]);
        
        cerrarModal();
      } else if (res.status === 401) {
        // Token inválido o expirado
        setModalError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
      } else {
        const errorData = await res.json().catch(() => ({}));
        setModalError(`Error: ${errorData.error || 'No se pudo enviar la reseña.'}`);
      }
    } catch (err) {
      console.error('Error al enviar reseña:', err);
      setModalError('Ocurrió un error al enviar la reseña. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar estrellas
  const renderEstrellas = (calificacion: number, tamaño: 'sm' | 'md' | 'lg' = 'md') => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`${sizes[tamaño]} ${
              star <= calificacion ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading || checkingAuth) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="text-center mt-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="text-center mt-12">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">{error || 'Producto no encontrado'}</h2>
          <p className="text-gray-600 mb-4">El producto que buscas no está disponible.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const tallasDisponibles = producto.inventarios.filter(i => i.stock > 0);
  const calificacionPromedio = reseñas.length > 0 
    ? reseñas.reduce((sum, r) => sum + r.calificacion, 0) / reseñas.length 
    : 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <nav className="text-sm mb-6 text-gray-600">
        <a href="/" className="hover:text-blue-600 transition">Inicio</a> &gt; 
        <span className="ml-2 font-medium">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Galería de imágenes */}
        <div className="space-y-4">
          <div className="h-96 bg-gray-100 rounded-xl overflow-hidden shadow-lg">
            {producto.imagenes && producto.imagenes.length > 0 && !imageError[imagenActual] ? (
              <img
                src={producto.imagenes[imagenActual]?.urlImagen}
                alt={producto.nombre}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(prev => ({ ...prev, [imagenActual]: true }))}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-5xl mb-2">🖼️</div>
                  <p>{imageError[imagenActual] ? 'Error al cargar imagen' : 'Sin imagen disponible'}</p>
                </div>
              </div>
            )}
          </div>

          {producto.imagenes && producto.imagenes.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto py-2">
              {producto.imagenes.map((img, index) => (
                <button
                  key={img.idImagen}
                  onClick={() => setImagenActual(index)}
                  className={`flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border-2 transition ${
                    imagenActual === index 
                      ? 'border-blue-500 shadow-md' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={img.urlImagen}
                    alt={`${producto.nombre} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(prev => ({ ...prev, [index]: true }))}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalles del producto */}
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">{producto.nombre}</h1>
          
          <div className="flex items-center mb-4">
            {renderEstrellas(Math.round(calificacionPromedio))}
            <span className="ml-2 text-gray-600">
              {calificacionPromedio.toFixed(1)} ({reseñas.length} reseñas)
            </span>
          </div>
          
          <p className="text-gray-600 mb-6 leading-relaxed">{producto.descripcion}</p>
          
          <div className="mb-6">
            <span className="text-3xl font-bold text-gray-900">${producto.precio.toFixed(2)}</span>
            <span className="ml-2 text-sm text-gray-500">MXN</span>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-medium">Marca:</span> {producto.marca.nombre}
          </p>

          <div className="mb-6">
            <label className="block font-semibold text-gray-800 mb-2">Selecciona talla:</label>
            <div className="flex flex-wrap gap-2">
              {tallasDisponibles.length > 0 ? (
                tallasDisponibles.map((inv) => (
                  <button
                    key={inv.talla.nombreTalla}
                    onClick={() => setSelectedTalla(inv.talla.nombreTalla)}
                    className={`px-4 py-2 rounded-lg border transition ${
                      selectedTalla === inv.talla.nombreTalla
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {inv.talla.nombreTalla}
                    <span className="text-xs ml-1 opacity-75">({inv.stock})</span>
                  </button>
                ))
              ) : (
                <p className="text-red-500">Sin stock disponible</p>
              )}
            </div>
          </div>

          <div className="mb-8">
            <label className="block font-semibold text-gray-800 mb-2">Cantidad:</label>
            <div className="flex items-center max-w-xs">
              <button
                onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
                className="px-4 py-2 border border-gray-300 rounded-l-lg hover:bg-gray-50"
                disabled={cantidad <= 1}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={selectedTalla ? tallasDisponibles.find(t => t.talla.nombreTalla === selectedTalla)?.stock || 1 : 1}
                value={cantidad}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  const max = selectedTalla ? tallasDisponibles.find(t => t.talla.nombreTalla === selectedTalla)?.stock || 1 : 1;
                  setCantidad(Math.max(1, Math.min(max, value)));
                }}
                className="w-20 py-2 border-t border-b border-gray-300 text-center"
              />
              <button
                onClick={() => {
                  const max = selectedTalla ? tallasDisponibles.find(t => t.talla.nombreTalla === selectedTalla)?.stock || 1 : 1;
                  setCantidad(prev => Math.min(max, prev + 1));
                }}
                className="px-4 py-2 border border-gray-300 rounded-r-lg hover:bg-gray-50"
                disabled={cantidad >= (selectedTalla ? tallasDisponibles.find(t => t.talla.nombreTalla === selectedTalla)?.stock || 1 : 1)}
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAgregarAlCarrito}
            disabled={!selectedTalla || tallasDisponibles.length === 0}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            {selectedTalla ? 'Agregar al Carrito' : 'Selecciona una talla'}
          </button>
        </div>
      </div>

      {/* Sección de reseñas */}
      <div className="mt-12 border-t pt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reseñas de clientes</h2>
            <p className="text-gray-600 mt-1">
              {reseñas.length === 0 ? 'Aún no hay reseñas' : `${reseñas.length} reseñas`}
            </p>
          </div>
          
          <button
            onClick={abrirModalReseña}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 flex items-center gap-2 transition"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            Dejar reseña
          </button>
        </div>

        {loadingReseñas ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Cargando reseñas...</p>
          </div>
        ) : reseñas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay reseñas aún</h3>
            <p className="text-gray-600 mb-6">¡Sé el primero en compartir tu experiencia!</p>
            <button
              onClick={abrirModalReseña}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Escribir primera reseña
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reseñas.map((resena) => (
              <div key={resena.idResena} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <UserCircleIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {resena.usuario?.nombre || 'Usuario'} {resena.usuario?.apellido || ''}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(resena.fecha).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div>
                    {renderEstrellas(resena.calificacion, 'sm')}
                  </div>
                </div>
                
                {resena.comentario && (
                  <p className="text-gray-700 mt-3 leading-relaxed">"{resena.comentario}"</p>
                )}
                
                {resena.respuestaAdmin && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center mb-1">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-600 text-sm font-bold">E</span>
                      </div>
                      <span className="font-medium text-blue-700">EromodeShop</span>
                    </div>
                    <p className="text-blue-600 text-sm mt-1">{resena.respuestaAdmin}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para nueva reseña */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Fondo oscuro */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={cerrarModal}
          ></div>
          
          {/* Contenedor del modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
              {/* Header del modal */}
              <div className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Dejar una reseña</h3>
                    {userName && (
                      <p className="text-gray-600 text-sm mt-1">Publicar como: {userName}</p>
                    )}
                  </div>
                  <button
                    onClick={cerrarModal}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Contenido del modal */}
              <div className="px-6 py-4">
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden mr-4">
                      {producto.imagenes && producto.imagenes[0] && (
                        <img
                          src={producto.imagenes[0].urlImagen}
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{producto.nombre}</h4>
                      <p className="text-sm text-gray-600">Marca: {producto.marca.nombre}</p>
                    </div>
                  </div>
                </div>
                
                {/* Calificación */}
                <div className="mb-6">
                  <label className="block font-medium text-gray-800 mb-3">
                    ¿Cómo calificas este producto?
                  </label>
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNuevaReseña(prev => ({ ...prev, calificacion: star }))}
                        className="transform hover:scale-110 transition-transform"
                      >
                        <StarIcon
                          className={`h-10 w-10 ${
                            star <= nuevaReseña.calificacion
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-gray-600 text-sm">
                    {['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][nuevaReseña.calificacion - 1]}
                  </p>
                </div>
                
                {/* Comentario */}
                <div className="mb-6">
                  <label className="block font-medium text-gray-800 mb-2">
                    Tu experiencia
                  </label>
                  <textarea
                    placeholder="Comparte detalles sobre el producto, calidad, talla, envío, etc..."
                    value={nuevaReseña.comentario}
                    onChange={(e) => setNuevaReseña(prev => ({ ...prev, comentario: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                    rows={4}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Tu reseña será visible para otros clientes.
                  </p>
                </div>
                
                {/* Mensaje de error */}
                {modalError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                    {modalError}
                  </div>
                )}
              </div>
              
              {/* Footer del modal */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
                <div className="flex gap-3">
                  <button
                    onClick={cerrarModal}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEnviarReseña}
                    disabled={isSubmitting || !nuevaReseña.comentario.trim()}
                    className="flex-1 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </>
                    ) : (
                      'Publicar reseña'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}