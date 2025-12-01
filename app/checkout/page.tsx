'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CarritoItem {
  idProducto: number;
  nombre: string;
  precio: number;
  talla: string;
  cantidad: number;
  imagen: string;
}

export default function CheckoutPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [metodoPago, setMetodoPago] = useState('tarjeta');
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const COSTO_ENVIO = 15.00; 
  const totalPagar = subtotal + COSTO_ENVIO;

  useEffect(() => {
    const verificarSesion = () => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    };

    const cargarCarrito = () => {
        const stored = localStorage.getItem('carrito');
        if (stored) {
            try {
                const parsed: CarritoItem[] = JSON.parse(stored);
                setCarrito(parsed);
                const calculatedSubtotal = parsed.reduce(
                    (sum: number, item: CarritoItem) => sum + item.precio * item.cantidad, 
                    0
                );
                setSubtotal(calculatedSubtotal);

                if (parsed.length === 0) {
                    alert('Tu carrito está vacío. Redirigiendo a la tienda.');
                    router.push('/');
                }
            } catch (error) {
                router.push('/');
            }
        } else {
            router.push('/');
        }
    };

    verificarSesion();
    cargarCarrito();
    setIsLoading(false);

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'token') verificarSesion();
        if (e.key === 'carrito') cargarCarrito();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const getImageUrl = (url: string) => {
    return url && !url.startsWith('http') ? `https://localhost:7220${url}` : url;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = 'https://via.placeholder.com/40x40?text=';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Debes iniciar sesión para confirmar la compra.');
        router.push('/login');
        return;
    }

    if (!nombre.trim() || !email.trim() || !direccion.trim()) {
        alert('Por favor completa todos los campos del formulario.');
        return;
    }

    if (carrito.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }

    // ⭐ Preparar datos del checkout CON los productos del carrito
    const checkoutData = {
        nombre: nombre.trim(),
        email: email.trim(),
        direccionEnvio: direccion.trim(),
        metodoPago: metodoPago,
        productos: carrito.map(item => ({
            idProducto: item.idProducto,
            nombre: item.nombre,
            talla: item.talla,
            cantidad: item.cantidad
        }))
    };

    try {
        const res = await fetch('https://localhost:7220/api/Orden/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(checkoutData) 
        });

        const responseText = await res.text();

        if (res.ok) {
            let ordenResponse = null;
            if (responseText) {
                try {
                    ordenResponse = JSON.parse(responseText);
                } catch(e) {
                    console.error('Error al parsear respuesta');
                }
            }

            // Limpiar carrito del localStorage
            localStorage.removeItem('carrito');
            setCarrito([]);
            setSubtotal(0);

            alert(`✅ ¡Gracias ${nombre}! Tu compra N° ${ordenResponse?.idOrden || 'N/A'} ha sido confirmada. Total: $${totalPagar.toFixed(2)}`);
            router.push('/');
            
        } else {
            let errorMessage = 'No se pudo procesar tu compra.';
            
            if (res.status === 401) {
                errorMessage = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
                localStorage.removeItem('token');
                setTimeout(() => router.push('/login'), 2000);
            } else if (responseText) {
                try {
                    const errorBody = JSON.parse(responseText);
                    errorMessage = errorBody.error || errorBody.title || errorBody.message || errorMessage;
                } catch (e) {
                    errorMessage = responseText;
                }
            }

            alert(`❌ ${errorMessage}`);
        }
    } catch (err) {
        alert('❌ Error de conexión: No se pudo conectar con el servidor.');
    }
  };

  if (isLoading || carrito.length === 0) {
      return (
          <div className="container mx-auto py-8 px-4 text-center">
              <p className="text-xl">Cargando...</p>
          </div>
      );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6">Información de Envío y Pago</h2>
            
            <div className={`p-4 mb-6 rounded-lg border-2 ${
                isLoggedIn ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
            }`}>
                <p className={`font-semibold flex items-center gap-2 ${
                    isLoggedIn ? 'text-green-700' : 'text-red-700'
                }`}>
                    {isLoggedIn ? (
                        <>
                            <span className="text-2xl">✅</span>
                            <span>Sesión Iniciada. Listo para confirmar tu compra.</span>
                        </>
                    ) : (
                        <>
                            <span className="text-2xl">❌</span>
                            <span>Debes iniciar sesión antes de confirmar la compra.</span>
                        </>
                    )}
                </p>
                {!isLoggedIn && (
                    <button
                        onClick={() => router.push('/login')}
                        className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                    >
                        Ir a Iniciar Sesión
                    </button>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block mb-1 font-semibold text-gray-700">
                        Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Juan Pérez"
                        disabled={!isLoggedIn}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-semibold text-gray-700">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="correo@ejemplo.com"
                        disabled={!isLoggedIn}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-semibold text-gray-700">
                        Dirección de Envío <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        required
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Calle, número, colonia, ciudad, estado, CP"
                        disabled={!isLoggedIn}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-semibold text-gray-700">
                        Método de Pago <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        disabled={!isLoggedIn}
                    >
                        <option value="tarjeta">💳 Tarjeta de Crédito</option>
                        <option value="oxxo">🏪 OXXO</option>
                        <option value="transferencia">🏦 Transferencia Bancaria</option>
                    </select>
                </div>

                <button
                    onClick={handleSubmit}
                    className={`w-full py-3 rounded-lg font-semibold text-lg transition duration-200 ${
                        isLoggedIn
                            ? 'bg-black text-white hover:bg-gray-700 cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!isLoggedIn}
                >
                    {isLoggedIn ? 'Confirmar Compra' : 'Debes Iniciar Sesión'}
                </button>
            </div>
        </div>
        
        <div className="lg:col-span-1 bg-gray-50 p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Tu Orden</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {carrito.map((item, index) => (
                    <div key={index} className="flex gap-3 items-center border-b pb-3 last:border-b-0">
                        <img
                            src={getImageUrl(item.imagen)}
                            alt={item.nombre}
                            className="w-12 h-12 object-cover rounded"
                            onError={handleImageError}
                        />
                        <div className="flex-1">
                            <p className="font-medium text-sm">{item.nombre}</p>
                            <p className="text-xs text-gray-500">Talla: {item.talla} | Cantidad: {item.cantidad}</p>
                        </div>
                        <p className="font-semibold text-sm">${(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                ))}
            </div>

            <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                    <span>Costo de Envío:</span>
                    <span>${COSTO_ENVIO.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t mt-3 pt-3 text-black">
                    <span>Total a Pagar:</span>
                    <span>${totalPagar.toFixed(2)}</span>
                </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">Impuestos incluidos si aplica.</p>
        </div>
      </div>
    </div>
  );
}