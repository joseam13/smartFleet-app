import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Database, 
  Settings, 
  Package, 
  Search,
  ChevronDown,
  Users,
  FileText,
  Key,
  Building,
  Truck,
  Car,
  UserCheck,
  Users as Clients,
  Wrench,
  CheckSquare,
  Cog,
  Fuel,
  LogOut,
  Calendar,
  Tool,
  BarChart3,
  Plus,
  Minus,
  Eye,
  Check
} from 'lucide-react';


const MainNavigation = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigationItems = [
    {
      id: 'seguridad',
      label: 'Seguridad',
      icon: <Shield className="h-5 w-5" />,
      submenu: [
        {
          id: 'usuarios-roles',
          label: 'Usuarios / Roles',
          icon: <Users className="h-4 w-4" />,
          path: '/seguridad/usuarios-roles'
        },
        {
          id: 'log-cambios',
          label: 'Log de Cambios',
          icon: <FileText className="h-4 w-4" />,
          path: '/seguridad/log-cambios'
        },
        {
          id: 'tokens',
          label: 'Tokens',
          icon: <Key className="h-4 w-4" />,
          path: '/seguridad/tokens'
        }
      ]
    },
    {
      id: 'catalogos',
      label: 'Catálogos',
      icon: <Database className="h-5 w-5" />,
      submenu: [
        {
          id: 'empresas',
          label: 'Empresas',
          icon: <Building className="h-4 w-4" />,
          path: '/catalogos/empresas'
        },
        {
          id: 'vehiculos',
          label: 'Vehículos',
          icon: <Truck className="h-4 w-4" />,
          path: '/catalogos/vehiculos'
        },
        {
          id: 'tipos-vehiculos',
          label: 'Tipos de Vehículos',
          icon: <Car className="h-4 w-4" />,
          path: '/catalogos/tipos-vehiculos'
        },
        {
          id: 'marcas-vehiculos',
          label: 'Marcas de Vehículos',
          icon: <Car className="h-4 w-4" />,
          path: '/catalogos/marcas-vehiculos'
        },
        {
          id: 'pilotos',
          label: 'Pilotos',
          icon: <UserCheck className="h-4 w-4" />,
          path: '/catalogos/pilotos'
        },
        {
          id: 'clientes',
          label: 'Clientes',
          icon: <Clients className="h-4 w-4" />,
          path: '/catalogos/clientes'
        },
        {
          id: 'sedes',
          label: 'Sedes / Talleres',
          icon: <Wrench className="h-4 w-4" />,
          path: '/catalogos/sedes'
        },
        {
          id: 'check-master',
          label: 'Elementos Hojas E/S',
          icon: <CheckSquare className="h-4 w-4" />,
          path: '/catalogos/check-master'
        },
        {
          id: 'repuestos-catalogo',
          label: 'Maestro de Repuestos',
          icon: <Package className="h-4 w-4" />,
          path: '/catalogos/repuestos-catalogo'
        },
        {
          id: 'vales-combustible',
          label: 'Vales de Combustible',
          icon: <Fuel className="h-4 w-4" />,
          path: '/catalogos/vales-combustible'
        },
        {
          id: 'repuestos-servicios',
          label: 'Repuestos p/ Servicios',
          icon: <Cog className="h-4 w-4" />,
          path: '/catalogos/repuestos-servicios'
        },
        {
          id: 'tasas-cargos',
          label: 'Tasas Cargos Directos',
          icon: <BarChart3 className="h-4 w-4" />,
          path: '/catalogos/tasas-cargos'
        }
      ]
    },
    {
      id: 'operaciones',
      label: 'Operaciones',
      icon: <Settings className="h-5 w-5" />,
      submenu: [


        {
          id: 'hoja-es',
          label: 'Hoja de Salida',
          icon: <FileText className="h-4 w-4" />,
          path: '/operaciones/salidas/hoja-es'
        },
        {
          id: 'autorizar-hoja-es',
          label: 'Autorizar/Cancelar Hoja de Salida',
          icon: <Check className="h-4 w-4" />,
          path: '/operaciones/salidas/autorizacion-hojas'
        },        
        {
          id: 'servicios',
          label: 'Servicios',
          icon: <Wrench className="h-4 w-4" />,
          path: '/operaciones/servicios'
        },
        {
          id: 'repuestos',
          label: 'Repuestos',
          icon: <Package className="h-4 w-4" />,
          path: '/operaciones/repuestos'
        },
        {
          id: 'ingreso-repuestos',
          label: 'Ingreso de Repuestos',
          icon: <Plus className="h-4 w-4" />,
          path: '/operaciones/ingreso-repuestos'
        }        
      ]
    },
    {
      id: 'procesos',
      label: 'Procesos',
      icon: <Package className="h-5 w-5" />,
      submenu: [
        {
          id: 'cambio-pilotos',
          label: 'Cambio Pilotos',
          icon: <UserCheck className="h-4 w-4" />,
          path: '/procesos/cambio-pilotos'
        }

      ]
    },
    {
      id: 'consultas',
      label: 'Consultas',
      icon: <Search className="h-5 w-5" />,
      submenu: [
        {
          id: 'ajustes-inventario',
          label: 'Ajustes al Inventario (+ / -)',
          icon: <Minus className="h-4 w-4" />,
          path: '/consultas/ajustes-inventario'
        },
        {
          id: 'vehiculos',
          label: 'Vehículos',
          icon: <Truck className="h-4 w-4" />,
          path: '/consultas/vehiculos'
        },
        {
          id: 'repuestos',
          label: 'Repuestos',
          icon: <Package className="h-4 w-4" />,
          path: '/consultas/repuestos'
        },
        {
          id: 'servicios',
          label: 'Servicios',
          icon: <Wrench className="h-4 w-4" />,
          path: '/consultas/servicios'
        },
        {
          id: 'pilotos',
          label: 'Pilotos',
          icon: <UserCheck className="h-4 w-4" />,
          path: '/consultas/pilotos'
        }
      ]
    }
  ];

  const handleMenuClick = (menuId) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">FleetSmart</span>
          </div>

          {/* Main Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleMenuClick(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeMenu === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      activeMenu === item.id ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Dropdown Menu */}
                {activeMenu === item.id && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.id}
                          to={subItem.path}
                          className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                        >
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Users className="h-4 w-4" />
              <span>{user?.full_name || user?.username || 'Usuario'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="px-4 py-2 space-y-1">
          {navigationItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors duration-150"
              >
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ChevronDown 
                  className={`h-4 w-4 transition-transform duration-200 ${
                    activeMenu === item.id ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {activeMenu === item.id && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.id}
                      to={subItem.path}
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                    >
                      {subItem.icon}
                      <span>{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation; 