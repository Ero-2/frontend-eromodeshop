'use client';

import { useState, useEffect } from 'react';
import {
  Trash2,
  Edit2,
  X,
  Save,
  Plus,
  Upload,
  ImageIcon,
  Package,
} from 'lucide-react';

interface Imagen {
  idImagen: number;
  urlImagen: string;
  esPrincipal: boolean;
}

interface Talla {
  nombreTalla: string;
}

interface Inventario {
  idInventario: number;
  stock: number;
  talla: Talla;
}

interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string;
  idMarca: number;
  precio: number;
  marca?: {
    idMarca: number;
    nombre: string;
  };
  imagenes?: Imagen[];
  inventarios?: Inventario[];
}

interface Marca {
  idMarca: number;
  nombre: string;
}

interface TallaDisponible {
  idTalla: number;
  nombreTalla: string;
}

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [tallas, setTallas] = useState<TallaDisponible[]>([]);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    idMarca: 0,
    precio: 0,
  });

  const [nuevaMarca, setNuevaMarca] = useState({ nombre: '' });
  const [editandoProducto, setEditandoProducto] = useState<Producto | null>(null);
  const [editandoMarca, setEditandoMarca] = useState<Marca | null>(null);

  const [vistaActual, setVistaActual] = useState<'productos' | 'marcas'>('productos');

  // Gestión de imágenes
  const [productoImagenes, setProductoImagenes] = useState<number | null>(null);
  const [imagenesProducto, setImagenesProducto] = useState<Imagen[]>([]);
  const [activeTab, setActiveTab] = useState<'imagenes' | 'stock'>('imagenes');

  // Gestión de stock
  const [nuevoStock, setNuevoStock] = useState({ idTalla: 0, stock: 0 });
  const [editandoStock, setEditandoStock] = useState<{ idInventario: number; stock: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // 👇 Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Productos por página

  // Cargar token
  useEffect(() => {
    const t = localStorage.getItem('token');
    setToken(t);
    setAuthLoading(false);
  }, []);

  // Cargar datos principales
  useEffect(() => {
    if (!token) return;
    setCurrentPage(1); // 👈 Resetear página al recargar
    cargarDatos();
    cargarTallas();
  }, [token]);

  const cargarDatos = async () => {
    if (!token) return;
    try {
      const [resProductos, resMarcas] = await Promise.all([
        fetch('https://localhost:7220/api/productos', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://localhost:7220/api/marcas', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resProductos.ok && resMarcas.ok) {
        const productosData: Producto[] = await resProductos.json();
        const marcasData: Marca[] = await resMarcas.json();
        setProductos(productosData);
        setMarcas(marcasData);
      }
    } catch (e) {
      console.error('Error en la red:', e);
    } finally {
      setLoading(false);
    }
  };

  const cargarTallas = async () => {
    if (!token) return;
    try {
      const res = await fetch('https://localhost:7220/api/productos/tallas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTallas(data);
      }
    } catch (e) {
      console.error('Error cargando tallas:', e);
    }
  };

  // ====== CARGAR IMÁGENES ======
  const cargarImagenes = async (idProducto: number) => {
    if (!token) return;
    try {
      const res = await fetch(`https://localhost:7220/api/imagenes/producto/${idProducto}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setImagenesProducto(data);
      }
    } catch (e) {
      console.error('Error cargando imágenes:', e);
    }
  };

  // ====== CRUD IMÁGENES ======
  const handleSubirImagen = async (idProducto: number, file: File) => {
    if (!token) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`https://localhost:7220/api/imagenes/upload/${idProducto}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        await cargarImagenes(idProducto);
        alert('Imagen subida exitosamente');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (e) {
      console.error('Error al subir imagen:', e);
      alert('Error al subir imagen');
    }
  };

  const handleEliminarImagen = async (idImagen: number, idProducto: number) => {
    if (!token || !confirm('¿Eliminar esta imagen?')) return;
    try {
      const res = await fetch(`https://localhost:7220/api/imagenes/${idImagen}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await cargarImagenes(idProducto);
        alert('Imagen eliminada');
      }
    } catch (e) {
      console.error('Error al eliminar imagen:', e);
    }
  };

  // ====== CRUD STOCK ======
  const handleAgregarStock = async (idProducto: number) => {
    if (!token || nuevoStock.idTalla === 0 || nuevoStock.stock < 0) {
      alert('Selecciona una talla y define un stock válido (≥0).');
      return;
    }
    try {
      const res = await fetch(`https://localhost:7220/api/productos/${idProducto}/inventario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nuevoStock),
      });

      if (res.ok) {
        await cargarDatos();
        setNuevoStock({ idTalla: 0, stock: 0 });
        alert('Stock agregado exitosamente');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (e) {
      console.error('Error al agregar stock:', e);
      alert('Error de red al agregar stock');
    }
  };

  const handleActualizarStock = async () => {
    if (!token || !editandoStock) return;
    try {
      const res = await fetch(`https://localhost:7220/api/productos/inventario/${editandoStock.idInventario}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: editandoStock.stock }),
      });

      if (res.ok) {
        await cargarDatos();
        setEditandoStock(null);
        alert('Stock actualizado');
      } else {
        alert('Error al actualizar stock');
      }
    } catch (e) {
      console.error('Error al actualizar stock:', e);
    }
  };

  const handleEliminarStock = async (idInventario: number, idProducto: number) => {
    if (!token || !confirm('¿Eliminar este registro de stock? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`https://localhost:7220/api/productos/inventario/${idInventario}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await cargarDatos();
        alert('Registro de stock eliminado');
      }
    } catch (e) {
      console.error('Error al eliminar stock:', e);
    }
  };

  // ====== CRUD PRODUCTOS ======
  const handleCrearProducto = async () => {
    if (!token || nuevoProducto.idMarca === 0) {
      alert('Por favor selecciona una marca');
      return;
    }
    try {
      const res = await fetch('https://localhost:7220/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nuevoProducto),
      });

      if (res.ok) {
        await cargarDatos();
        setNuevoProducto({ nombre: '', descripcion: '', idMarca: 0, precio: 0 });
        alert('Producto creado exitosamente');
      } else {
        const errorText = await res.text();
        alert(`Error: ${errorText}`);
      }
    } catch (e) {
      console.error('Error creando producto:', e);
      alert('Error de red al crear producto');
    }
  };

  const handleEditarProducto = async () => {
    if (!token || !editandoProducto) return;
    try {
      const res = await fetch(`https://localhost:7220/api/productos/${editandoProducto.idProducto}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idProducto: editandoProducto.idProducto,
          nombre: editandoProducto.nombre,
          descripcion: editandoProducto.descripcion,
          idMarca: editandoProducto.idMarca,
          precio: editandoProducto.precio,
        }),
      });

      if (res.ok) {
        await cargarDatos();
        setEditandoProducto(null);
        alert('Producto actualizado exitosamente');
      } else {
        alert('Error al actualizar producto');
      }
    } catch (e) {
      console.error('Error actualizando producto:', e);
    }
  };

  const handleEliminarProducto = async (id: number) => {
    if (!token || !confirm('¿Seguro que deseas eliminar este producto y todos sus datos?')) return;
    try {
      const res = await fetch(`https://localhost:7220/api/productos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await cargarDatos();
        alert('Producto eliminado');
      } else {
        alert('Error al eliminar producto');
      }
    } catch (e) {
      console.error('Error eliminando producto:', e);
    }
  };

  // ====== CRUD MARCAS ======
  const handleCrearMarca = async () => {
    if (!token || !nuevaMarca.nombre.trim()) {
      alert('Ingresa un nombre de marca');
      return;
    }
    try {
      const res = await fetch('https://localhost:7220/api/marcas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nuevaMarca),
      });

      if (res.ok) {
        await cargarDatos();
        setNuevaMarca({ nombre: '' });
        alert('Marca creada exitosamente');
      } else {
        alert('Error al crear marca');
      }
    } catch (e) {
      console.error('Error creando marca:', e);
    }
  };

  const handleEditarMarca = async () => {
    if (!token || !editandoMarca) return;
    try {
      const res = await fetch(`https://localhost:7220/api/marcas/${editandoMarca.idMarca}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editandoMarca),
      });

      if (res.ok) {
        await cargarDatos();
        setEditandoMarca(null);
        alert('Marca actualizada');
      } else {
        alert('Error al actualizar marca');
      }
    } catch (e) {
      console.error('Error actualizando marca:', e);
    }
  };

  const handleEliminarMarca = async (id: number) => {
    if (!token || !confirm('¿Seguro? Esto puede afectar productos asociados')) return;
    try {
      const res = await fetch(`https://localhost:7220/api/marcas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await cargarDatos();
        alert('Marca eliminada');
      } else {
        alert('Error al eliminar marca');
      }
    } catch (e) {
      console.error('Error eliminando marca:', e);
    }
  };

  // ====== RENDERIZADO ======
  if (authLoading) {
    return <p className="text-center mt-12">Cargando...</p>;
  }

  if (!token) {
    return <p className="text-center mt-12">Acceso denegado. Debes iniciar sesión.</p>;
  }

  if (loading) {
    return <p className="text-center mt-12">Cargando panel de administración...</p>;
  }

  const abrirGestorProducto = (idProducto: number) => {
    setProductoImagenes(idProducto);
    setActiveTab('imagenes');
    cargarImagenes(idProducto);
  };

  // 👇 Lógica de paginación
  const totalItems = productos.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const productosPaginados = productos.slice(startIndex, startIndex + pageSize);

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>

      {/* Pestañas */}
      <div className="flex gap-4 mb-8 border-b">
        <button
          onClick={() => setVistaActual('productos')}
          className={`pb-2 px-4 font-semibold ${
            vistaActual === 'productos'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setVistaActual('marcas')}
          className={`pb-2 px-4 font-semibold ${
            vistaActual === 'marcas'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          Marcas
        </button>
      </div>

      {/* ====== VISTA PRODUCTOS ====== */}
      {vistaActual === 'productos' && (
        <>
          {/* Formulario crear/editar producto */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus size={20} />
              {editandoProducto ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editandoProducto ? editandoProducto.nombre : nuevoProducto.nombre}
                onChange={(e) =>
                  editandoProducto
                    ? setEditandoProducto({ ...editandoProducto, nombre: e.target.value })
                    : setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Descripción"
                className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editandoProducto ? editandoProducto.descripcion : nuevoProducto.descripcion}
                onChange={(e) =>
                  editandoProducto
                    ? setEditandoProducto({ ...editandoProducto, descripcion: e.target.value })
                    : setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })
                }
              />
              <select
                className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editandoProducto ? editandoProducto.idMarca : nuevoProducto.idMarca}
                onChange={(e) =>
                  editandoProducto
                    ? setEditandoProducto({ ...editandoProducto, idMarca: Number(e.target.value) })
                    : setNuevoProducto({ ...nuevoProducto, idMarca: Number(e.target.value) })
                }
              >
                <option value={0}>Seleccionar marca</option>
                {marcas.map((marca) => (
                  <option key={marca.idMarca} value={marca.idMarca}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Precio"
                className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editandoProducto ? editandoProducto.precio : nuevoProducto.precio || ''}
                onChange={(e) =>
                  editandoProducto
                    ? setEditandoProducto({ ...editandoProducto, precio: Number(e.target.value) })
                    : setNuevoProducto({ ...nuevoProducto, precio: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex gap-3 mt-4">
              {editandoProducto ? (
                <>
                  <button
                    onClick={handleEditarProducto}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Save size={18} />
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => setEditandoProducto(null)}
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 flex items-center gap-2"
                  >
                    <X size={18} />
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCrearProducto}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Agregar Producto
                </button>
              )}
            </div>
          </div>

          {/* Lista de productos */}
          <h2 className="text-xl font-semibold mb-4">Productos en la tienda ({productos.length})</h2>
          <div className="space-y-3">
            {productosPaginados.map((p) => (
              <div key={p.idProducto} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-bold text-lg">{p.nombre}</div>
                  <div className="text-gray-600 text-sm">{p.descripcion}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Marca: {p.marca?.nombre || 'Sin marca'}
                  </div>
                  <div className="text-xs mt-1">
                    {p.inventarios?.length ? (
                      <div>
                        {p.inventarios.map((inv) => (
                          <span key={inv.talla.nombreTalla} className="mr-2">
                            {inv.talla.nombreTalla}: <b>{inv.stock}</b>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-red-500">Sin stock configurado</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-green-600">${p.precio.toFixed(2)}</span>
                  <button
                    onClick={() => abrirGestorProducto(p.idProducto)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                    title="Gestionar imágenes y stock"
                  >
                    <Package size={18} />
                  </button>
                  <button
                    onClick={() => setEditandoProducto(p)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleEliminarProducto(p.idProducto)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ====== PAGINACIÓN ====== */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

      {/* ====== VISTA MARCAS ====== */}
      {vistaActual === 'marcas' && (
        <>
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus size={20} />
              {editandoMarca ? 'Editar Marca' : 'Agregar Nueva Marca'}
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Nombre de la marca"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={editandoMarca ? editandoMarca.nombre : nuevaMarca.nombre}
                onChange={(e) =>
                  editandoMarca
                    ? setEditandoMarca({ ...editandoMarca, nombre: e.target.value })
                    : setNuevaMarca({ nombre: e.target.value })
                }
              />
              {editandoMarca ? (
                <>
                  <button
                    onClick={handleEditarMarca}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Save size={18} />
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoMarca(null)}
                    className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500"
                  >
                    <X size={18} />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCrearMarca}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Agregar Marca
                </button>
              )}
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Marcas registradas ({marcas.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marcas.map((m) => (
              <div key={m.idMarca} className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
                <span className="font-semibold text-lg">{m.nombre}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditandoMarca(m)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleEliminarMarca(m.idMarca)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ====== MODAL GESTIÓN DE IMÁGENES Y STOCK ====== */}
      {productoImagenes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Gestionar Producto</h2>
              <button
                onClick={() => setProductoImagenes(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Pestañas */}
            <div className="border-b mb-4">
              <button
                onClick={() => setActiveTab('imagenes')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'imagenes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                }`}
              >
                Imágenes
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'stock' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                }`}
              >
                Stock
              </button>
            </div>

            {activeTab === 'imagenes' && (
              <>
                <div className="mb-6">
                  <label className="block w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleSubirImagen(productoImagenes, e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Upload size={20} />
                      <span>Click para subir imagen</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {imagenesProducto.map((img) => (
                    <div key={img.idImagen} className="relative border rounded-lg overflow-hidden">
                      <img
                        src={`https://localhost:7220${img.urlImagen}`}
                        alt="Producto"
                        className="w-full h-48 object-cover"
                      />
                      {img.esPrincipal && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs rounded">
                          Principal
                        </div>
                      )}
                      <button
                        onClick={() => handleEliminarImagen(img.idImagen, productoImagenes)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded hover:bg-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'stock' && (
              <>
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Agregar Stock</h3>
                  <select
                    className="p-2 border rounded mb-2 w-full"
                    value={nuevoStock.idTalla}
                    onChange={(e) => setNuevoStock({ ...nuevoStock, idTalla: Number(e.target.value) })}
                  >
                    <option value={0}>Seleccionar talla</option>
                    {tallas.map((t) => (
                      <option key={t.idTalla} value={t.idTalla}>
                        {t.nombreTalla}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="Cantidad en stock"
                    className="p-2 border rounded w-full mb-2"
                    value={nuevoStock.stock}
                    onChange={(e) => setNuevoStock({ ...nuevoStock, stock: Math.max(0, Number(e.target.value)) })}
                  />
                  <button
                    onClick={() => handleAgregarStock(productoImagenes)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                  >
                    + Agregar Stock
                  </button>
                </div>

                <h3 className="font-semibold mb-2">Stock Actual</h3>
                <div className="space-y-2">
                  {productos
                    .find((p) => p.idProducto === productoImagenes)
                    ?.inventarios?.map((inv) => (
                      <div key={inv.idInventario} className="flex justify-between items-center p-2 border rounded">
                        <span>
                          <b>{inv.talla.nombreTalla}</b>: {inv.stock} unidades
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditandoStock({ idInventario: inv.idInventario, stock: inv.stock })}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleEliminarStock(inv.idInventario, productoImagenes)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )) || <p className="text-gray-500 text-sm">No hay stock registrado para este producto.</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal editar stock */}
      {editandoStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-bold mb-4">Editar Stock</h3>
            <input
              type="number"
              min="0"
              className="w-full p-2 border rounded mb-4"
              value={editandoStock.stock}
              onChange={(e) => setEditandoStock({ ...editandoStock, stock: Math.max(0, Number(e.target.value)) })}
            />
            <div className="flex gap-3">
              <button
                onClick={handleActualizarStock}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Guardar
              </button>
              <button
                onClick={() => setEditandoStock(null)}
                className="flex-1 bg-gray-300 text-black py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}