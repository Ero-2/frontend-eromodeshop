// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from './components/Header';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ero Mode Shop - Tu tienda de tenis",
  description: "Compra los mejores tenis en Ero Mode Shop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header /> {/* ← Aquí importamos el header con cliente */}
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

// Footer (opcional)
function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 px-6">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} Ero Mode Shop. Todos los derechos reservados.</p>
        <p className="text-gray-400 mt-2">Tienda especializada en tenis exclusivos</p>
      </div>
    </footer>
  );
}