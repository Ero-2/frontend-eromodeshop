'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('https://localhost:7220/api/usuarios/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, email, password }),
      });

      if (res.ok) {
        alert('¡Registro exitoso!');
        router.push('/login');
      } else {
        alert('Error al registrarse');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 mt-12 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 font-['EroSubstitles']">
        Registrarse
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 font-['EroSub']">Nombre</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 font-['EroSub']">Apellido</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 font-['EroSub']">Email</label>
          <input
            type="email"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-gray-700 font-['EroSub']">Contraseña</label>
          <input
            type="password"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
      <p className="mt-4 text-center text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <a href="/login" className="text-blue-600 font-['EroSubstitles']">
          Inicia sesión
        </a>
      </p>
    </div>
  );
}