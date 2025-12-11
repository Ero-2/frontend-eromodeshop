'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Store, Landmark, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface CarritoItem {
  idProducto: number;
  nombre: string;
  precio: number;
  cantidad: number;
  talla: string;
  imagen: string;
}

interface PerfilUsuario {
  idUsuario: number;
  nombre: string;
  apellido?: string;
  email: string;
  fechaCreacion: Date;
}

export default function CheckoutUnificadoPage() {
  // Estados del perfil de usuario
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');

  // Estados del pago
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'oxxo' | 'transferencia'>('tarjeta');
  const [datos, setDatos] = useState({
    numeroTarjeta: '',
    fechaExpiracion: '',
    cvv: '',
    referenciaOxxo: '',
    cuentaTransferencia: '',
  });

  // Estados del carrito
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [totalPagar, setTotalPagar] = useState(0);

  const COSTO_ENVIO = 15.00;

  // Estados generales
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [perfilCargado, setPerfilCargado] = useState(false);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  const router = useRouter();

  // Cargar perfil
  useEffect(() => {
    const cargarPerfil = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setCargandoPerfil(false);
        return;
      }

      try {
        const res = await fetch('https://localhost:7220/api/Usuarios/perfil', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data: PerfilUsuario = await res.json();
          setNombreCompleto(data.apellido ? `${data.nombre} ${data.apellido}` : data.nombre);
          setEmail(data.email);
          setPerfilCargado(true);
        }
      } catch (err) {
        console.error('Error al cargar perfil:', err);
      } finally {
        setCargandoPerfil(false);
      }
    };

    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (token) cargarPerfil();
  }, []);

  // Cargar carrito
  useEffect(() => {
    const cargarCarrito = () => {
      const stored = localStorage.getItem('carrito');
      if (stored) {
        try {
          const parsed: CarritoItem[] = JSON.parse(stored);
          setCarrito(parsed);
          const sub = parsed.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
          setSubtotal(sub);
          setTotalPagar(sub + COSTO_ENVIO);
        } catch {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    };
    cargarCarrito();
  }, [router]);

  // Formateo de tarjeta
  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const handleNumeroTarjetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDatos({ ...datos, numeroTarjeta: formatCardNumber(e.target.value) });
  };

  const handleFechaExpiracionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2, 4);
    else if (v.length >= 2) v = v.slice(0, 2) + '/';
    setDatos({ ...datos, fechaExpiracion: v });
  };

  // Validaciones y envío
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Debes iniciar sesión.');
      setLoading(false);
      return;
    }

    // Validar perfil
    if (!nombreCompleto.trim() || !email.trim() || !direccion.trim()) {
      setError('Completa todos los campos de envío.');
      setLoading(false);
      return;
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido.');
      setLoading(false);
      return;
    }

    // Validar método de pago
    if (metodoPago === 'tarjeta') {
      if (!/^\d{16}$/.test(datos.numeroTarjeta.replace(/\s/g, ''))) {
        setError('Número de tarjeta inválido (16 dígitos).');
        setLoading(false);
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(datos.fechaExpiracion)) {
        setError('Fecha de expiración inválida (MM/AA).');
        setLoading(false);
        return;
      }
      if (!/^\d{3,4}$/.test(datos.cvv)) {
        setError('CVV inválido.');
        setLoading(false);
        return;
      }
    } else if (metodoPago === 'oxxo' && !datos.referenciaOxxo.trim()) {
      setError('Ingresa la referencia de OXXO.');
      setLoading(false);
      return;
    } else if (metodoPago === 'transferencia' && !datos.cuentaTransferencia.trim()) {
      setError('Ingresa el número de cuenta o CLABE.');
      setLoading(false);
      return;
    }

    // ✅ Payload unificado
    const payload = {
      nombre: nombreCompleto.trim(),
      email: email.trim(),
      direccionEnvio: direccion.trim(),
      metodoPago: metodoPago,
      productos: carrito.map(item => ({
        idProducto: item.idProducto,
        nombre: item.nombre,
        talla: item.talla,
        cantidad: item.cantidad
      })),
      // Campos de pago (solo para validación, no se guardan)
      ...(metodoPago === 'tarjeta' && {
        numeroTarjeta: datos.numeroTarjeta.replace(/\s/g, ''),
        fechaExpiracion: datos.fechaExpiracion,
        cvv: datos.cvv
      }),
      ...(metodoPago === 'oxxo' && { referenciaOxxo: datos.referenciaOxxo }),
      ...(metodoPago === 'transferencia' && { cuentaTransferencia: datos.cuentaTransferencia })
    };

    try {
      const res = await fetch('https://localhost:7220/api/Orden/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(true);
        localStorage.removeItem('carrito');
        setTimeout(() => router.push('/mis-pedidos'), 2500);
      } else {
        const err = await res.json();
        setError(err.error || 'Error al procesar la compra.');
      }
    } catch (err: any) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    return url && !url.startsWith('http') ? `https://localhost:7220${url}` : url;
  };

  if (carrito.length === 0) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
        <button onClick={() => router.push('/')} className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">
          Ir a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Confirmar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resumen del pedido (del ConfirmarPagoPage) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Resumen de tu compra</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {carrito.map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <img src={getImageUrl(item.imagen)} alt={item.nombre} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.nombre}</h3>
                  <p className="text-sm text-gray-600">Talla: {item.talla} | Cantidad: {item.cantidad}</p>
                  <p className="text-lg font-semibold text-gray-900">${(item.precio * item.cantidad).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Envío:</span>
              <span>${COSTO_ENVIO.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t">
              <span>Total:</span>
              <span>${totalPagar.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Formulario unificado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6">Información y Pago</h2>

          {/* Perfil */}
          {!isLoggedIn ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-red-700">⚠️ Debes iniciar sesión para confirmar la compra.</p>
              <button
                onClick={() => router.push('/login')}
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Iniciar Sesión
              </button>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  disabled={cargandoPerfil}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  disabled={cargandoPerfil}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Envío *</label>
                <textarea
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Método de pago (del ConfirmarPagoPage) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMetodoPago('tarjeta')}
                className={`p-3 border rounded-lg flex flex-col items-center ${
                  metodoPago === 'tarjeta' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <CreditCard size={20} className="mb-1" />
                <span className="text-xs">Tarjeta</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago('oxxo')}
                className={`p-3 border rounded-lg flex flex-col items-center ${
                  metodoPago === 'oxxo' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
              >
                <Store size={20} className="mb-1" />
                <span className="text-xs">OXXO</span>
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago('transferencia')}
                className={`p-3 border rounded-lg flex flex-col items-center ${
                  metodoPago === 'transferencia' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                }`}
              >
                <Landmark size={20} className="mb-1" />
                <span className="text-xs">Transferencia</span>
              </button>
            </div>
          </div>

          {/* Campos de pago */}
          {metodoPago === 'tarjeta' && (
            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Número de tarjeta"
                value={datos.numeroTarjeta}
                onChange={handleNumeroTarjetaChange}
                maxLength={19}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="MM/AA"
                  value={datos.fechaExpiracion}
                  onChange={handleFechaExpiracionChange}
                  maxLength={5}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  value={datos.cvv}
                  onChange={(e) => setDatos({ ...datos, cvv: e.target.value.replace(/\D/g, '') })}
                  maxLength={4}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-500">Tus datos se procesan de forma segura.</p>
            </div>
          )}

          {metodoPago === 'oxxo' && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Referencia OXXO (10-13 dígitos)"
                value={datos.referenciaOxxo}
                onChange={(e) => setDatos({ ...datos, referenciaOxxo: e.target.value.replace(/\D/g, '') })}
                maxLength={13}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          {metodoPago === 'transferencia' && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Número de cuenta o CLABE"
                value={datos.cuentaTransferencia}
                onChange={(e) => setDatos({ ...datos, cuentaTransferencia: e.target.value.replace(/\D/g, '') })}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
              <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200 text-sm">
                <p className="font-medium text-purple-800">Datos para transferencia:</p>
                <p>Banco: <strong>BBVA</strong></p>
                <p>CLABE: <code className="font-mono">012180015001234567</code></p>
                <p>Titular: <strong>Ero Mode Shop</strong></p>
              </div>
            </div>
          )}

          {/* Botón */}
          <button
            onClick={handleSubmit}
            disabled={!isLoggedIn || loading}
            className={`w-full py-3 rounded-lg font-semibold text-white ${
              !isLoggedIn ? 'bg-gray-400 cursor-not-allowed' : loading ? 'bg-gray-600' : 'bg-black hover:bg-gray-800'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Procesando...
              </span>
            ) : (
              'Confirmar Compra'
            )}
          </button>
        </div>
      </div>

      {/* Mensajes de error y éxito */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <XCircle className="text-red-500" size={20} />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Compra Confirmada!</h2>
            <p className="text-gray-600">Gracias por tu compra. Serás redirigido a tus pedidos...</p>
          </div>
        </div>
      )}
    </div>
  );
}