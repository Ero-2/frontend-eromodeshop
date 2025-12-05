'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Interfaz que coincide con PerfilDTO
interface Usuario {
  idUsuario: number;  // 🚨 CAMBIO: debe coincidir con el JSON (camelCase)
  nombre: string;     // 🚨 CAMBIO: debe coincidir con el JSON
  apellido?: string;  // 🚨 CAMBIO: debe coincidir con el JSON
  email: string;      // 🚨 CAMBIO: debe coincidir con el JSON
  fechaCreacion: Date; // 🚨 CAMBIO: debe coincidir con el JSON
}

export default function MiCuentaPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const cargarPerfil = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No hay token en localStorage.');
        setError('No estás autenticado. Redirigiendo...');
        setTimeout(() => router.push('/login'), 2000);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('https://localhost:7220/api/Usuarios/perfil', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Respuesta del servidor:', {
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries())
        });

        if (res.status === 401) {
          console.error('Token inválido o expirado.');
          localStorage.removeItem('token'); 
          setError('Sesión expirada. Redirigiendo al login...');
          setTimeout(() => router.push('/login'), 2000);
          setLoading(false);
          return;
        } 

        if (res.ok) {
          const data: Usuario = await res.json();
          console.log('Datos recibidos:', data); // 🚨 Verifica esto en la consola
          setUsuario(data);
        } else {
          // Intentar obtener más detalles del error
          const errorText = await res.text();
          console.error('Error en respuesta:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            setError(errorData.message || errorData.title || `Error ${res.status}: ${res.statusText}`);
          } catch {
            setError(`Error ${res.status}: ${res.statusText}`);
          }
        }
      } catch (err) {
        console.error('Error de conexión o red:', err);
        setError('Error de conexión con el servidor. Verifica que el backend esté ejecutándose.');
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, [router]);

  // Mostrar estados de carga y error
  if (loading) return <div className="container mx-auto py-8 px-4">Cargando perfil...</div>;
  if (error) return <div className="container mx-auto py-8 px-4 text-red-500">Error: {error}</div>;

  // Verificar que tenemos datos del usuario
  if (!usuario) return <div className="container mx-auto py-8 px-4">No se encontraron datos del usuario.</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Mi Cuenta</h1>

      <div className="max-w-2xl bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Información Personal</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Nombre</label>
            <p className="p-2 bg-gray-100 rounded">
              {usuario.nombre} {usuario.apellido || ''}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <p className="p-2 bg-gray-100 rounded">{usuario.email}</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">ID de Usuario</label>
            <p className="p-2 bg-gray-100 rounded">{usuario.idUsuario}</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Fecha de Registro</label>
            <p className="p-2 bg-gray-100 rounded">
              {usuario.fechaCreacion && !isNaN(new Date(usuario.fechaCreacion).getTime())
                ? new Date(usuario.fechaCreacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Fecha no disponible'}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => alert('Funcionalidad de edición aún no implementada.')}
            className="bg-black text-white py-2 px-4 rounded hover:bg-gray-700 transition disabled:opacity-50"
            disabled
          >
            Editar Perfil
          </button>
        </div>
      </div>
    </div>
  );
}