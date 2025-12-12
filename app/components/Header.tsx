
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCartIcon, UserIcon, TruckIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserName(payload.name || 'Usuario');
        setIsLoggedIn(true);

        const roles = payload.role || [];
        const isAdminFlag = Array.isArray(roles)
          ? roles.includes('Admin')
          : roles === 'Admin';

        setIsAdmin(isAdminFlag);
      } catch (e) {
        console.error('Token inválido:', e);
        setIsLoggedIn(false);
        setUserName('');
        setIsAdmin(false);
      }
    } else {
      setIsLoggedIn(false);
      setUserName('');
      setIsAdmin(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserName('');
    setIsAdmin(false);
    setShowUserMenu(false);
    window.location.href = '/';
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showUserMenu) {
        const target = e.target as Node;
        const menu = document.querySelector('.user-menu');
        if (menu && !menu.contains(target)) {
          setShowUserMenu(false);
        }
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  return (
    <header className="bg-black text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo y nombre */}
        <div className="flex items-center space-x-2">
          <img
            src="/images/logo.jpg"
            alt="Ero Mode Shop"
            className="w-12 h-12 object-contain"
          />
          <Link href="/" className="font-['EroModeFont'] text-xl font-bold tracking-wide">
            ERO MODE SHOP
          </Link>
        </div>

        {/* Botones */}
        <div className="flex items-center space-x-6">
          {/* Carrito */}
          <Link href="/carrito" className="flex items-center space-x-1 hover:text-gray-300">
            <ShoppingCartIcon className="h-6 w-6" />
            <span className="font-['EroSub'] text-sm"></span>
          </Link>

          {/* Tracking */}
          <Link href="/tracking" className="flex items-center space-x-1 hover:text-gray-300">
            <TruckIcon className="h-6 w-6" />
            <span className="font-['EroSub'] text-2xl"></span>
          </Link>

          {/* Enlaces de Admin */}
          {isAdmin && (
            <>
              <Link href="/ventas" className="font-['EroSub'] text-2xl hover:text-gray-300">
                Ventas
              </Link>
              <Link href="/admin/dashboard" className="font-['EroSub'] text-2xl hover:text-gray-300">
                Dashboard
              </Link>
              <Link href="/admin" className="font-['EroSub'] text-2xl hover:text-gray-300">
                Admin
              </Link>
            </>
          )}

          {/* Menú de usuario */}
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                className="flex items-center space-x-1 text-white hover:text-gray-300 font-medium"
              >
                <UserIcon className="h-5 w-5" />
                <span className="font-['EroSub'] text-2xl">{userName}</span>
              </button>

              {showUserMenu && (
                <div
                  className="user-menu absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* ✅ Mantiene "Mi Cuenta" */}
                  <Link
                    href="/mi-cuenta"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mi Cuenta
                  </Link>

                  {/* ✅ NUEVO: "Mis Compras" */}
                  <Link
                    href="/mis-pedidos"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mis Compras
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="flex items-center space-x-1 hover:text-gray-300">
                <UserIcon className="h-5 w-5" />
                <span className="font-['EroSub'] text-2xl">Iniciar Sesión</span>
              </Link>
              <Link href="/register" className="flex items-center space-x-1 hover:text-gray-300">
                <UserIcon className="h-5 w-5" />
                <span className="font-['EroSub'] text-2xl">Registrarse</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}