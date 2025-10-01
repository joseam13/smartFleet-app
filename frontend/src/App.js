import React from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import MainDashboard from './pages/MainDashboard';
import Dashboard from './pages/Dashboard';
import CatalogosIndex from './pages/catalogos/CatalogosIndex';
import Vehiculos from './pages/catalogos/Vehiculos';
import Pilotos from './pages/catalogos/Pilotos';
import Sedes from './pages/catalogos/Sedes';
import Clientes from './pages/catalogos/Clientes';
import UsuariosRoles from './pages/seguridad/UsuariosRoles';
import CheckMaster from './pages/catalogos/Check-master';
import TiposVehiculos from './pages/catalogos/Tipos-vehiculos';
import RepuestosCatalogo from './pages/catalogos/Repuestos-catalogo';
import ValesCombustible from './pages/catalogos/Vales-combustible';
// Operaciones
import HojaEN from './pages/operaciones/HojaEN';
import Salidas from './pages/operaciones/Salidas';
import HojaES from './pages/operaciones/HojaES';
import AutorizacionHojasES from './pages/operaciones/AutorizacionHojasES';
import Servicios from './pages/operaciones/Servicios';
import Repuestos from './pages/operaciones/Repuestos';
import IngresoRepuestos from './pages/operaciones/Ingreso-repuestos';
// Procesos
import CambioPilotos from './pages/procesos/Cambio-pilotos';


import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, loading } = useAuth();




  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} 
        />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <MainDashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/tasks" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        {/* Rutas de Catálogos */}
        <Route 
          path="/catalogos" 
          element={isAuthenticated ? <CatalogosIndex /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/catalogos/vehiculos" 
          element={isAuthenticated ? <Vehiculos /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/catalogos/pilotos" 
          element={isAuthenticated ? <Pilotos /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/catalogos/sedes" 
          element={isAuthenticated ? <Sedes /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/catalogos/clientes" 
          element={isAuthenticated ? <Clientes /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/catalogos/check-master" 
          element={isAuthenticated ? <CheckMaster /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/catalogos/tipos-vehiculos" 
          element={isAuthenticated ? <TiposVehiculos /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/catalogos/repuestos-catalogo" 
          element={isAuthenticated ? <RepuestosCatalogo /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/catalogos/vales-combustible" 
          element={isAuthenticated ? <ValesCombustible /> : <Navigate to="/login" />} 
        />

        {/* Rutas de Seguridad */}
        <Route 
          path="/seguridad/usuarios-roles" 
          element={isAuthenticated ? <UsuariosRoles /> : <Navigate to="/login" />} 
        />


        {/* Rutas de Operaciones */}
        <Route 
          path="/operaciones/salidas" 
          element={isAuthenticated ? <Salidas /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/operaciones/salidas/hoja-es" 
          element={isAuthenticated ? <HojaES /> : <Navigate to="/login" />} 
        />
        <Route
          path="/operaciones/hoja-en"
          element={isAuthenticated ? <HojaEN /> : <Navigate to="/login" />}
        />
        <Route 
          path="/operaciones/salidas/autorizacion-hojas" 
          element={isAuthenticated ? <AutorizacionHojasES /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/operaciones/servicios" 
          element={isAuthenticated ? <Servicios /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/operaciones/repuestos" 
          element={isAuthenticated ? <Repuestos /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/operaciones/ingreso-repuestos" 
          element={isAuthenticated ? <IngresoRepuestos /> : <Navigate to="/login" />} 
        />
       


        {/* Rutas de Procesos */}

        <Route 
          path="/procesos/cambio-pilotos" 
          element={isAuthenticated ? <CambioPilotos /> : <Navigate to="/login" />} 
        />
       
      </Routes>
    </div>
  );
}

export default App; 