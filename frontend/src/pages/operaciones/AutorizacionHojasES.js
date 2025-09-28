import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import MainNavigation from '../../components/MainNavigation';
import Breadcrumb from '../../components/Breadcrumb';
import ModalAutorizacion from '../../components/HojasES/ModalAutorizacion';
import ModalFotosAutorizacion from '../../components/HojasES/ModalFotosAutorizacion';
import axiosInstance from '../../utils/axiosConfig';
import { Search, RefreshCw, Check, Camera, Eye, Filter } from 'lucide-react';

const AutorizacionHojasES = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hojas, setHojas] = useState([]);
  const [filteredHojas, setFilteredHojas] = useState([]);
  
  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({
    no_hoja: '',
    plataforma: '',
    placa: '',
    piloto: '',
    estado: 'ING',
    tipo_hoja: 'S'
  });

  // Estados de modales
  const [showModalAutorizacion, setShowModalAutorizacion] = useState(false);
  const [showModalFotos, setShowModalFotos] = useState(false);
  const [selectedHoja, setSelectedHoja] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadHojas();
  }, []);

  // Filtrar hojas cuando cambien los filtros
  useEffect(() => {
    filterHojas();
  }, [hojas, searchTerm, filtros]);

  const loadHojas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filtros).forEach(key => {
        if (filtros[key]) {
          params.append(key, filtros[key]);
        }
      });

      const response = await axiosInstance.get(`/api/hoja-es/autorizacion/hojas?${params}`);
      setHojas(response.data.data || []);
    } catch (error) {
      console.error('Error loading hojas:', error);
      alert('Error al cargar las hojas de salida');
    } finally {
      setLoading(false);
    }
  };

  const filterHojas = () => {
    let filtered = hojas;

    // Filtro por término de búsqueda general
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(hoja => {
        // Verificar que los campos no sean null antes de hacer toLowerCase
        const idPlataforma = hoja.id_plataforma ? hoja.id_plataforma.toLowerCase() : '';
        const placaVehiculo = hoja.placa_vehiculo ? hoja.placa_vehiculo.toLowerCase() : '';
        const nombres = hoja.nombres ? hoja.nombres : '';
        const apellidos = hoja.apellidos ? hoja.apellidos : '';
        const nombreCompleto = `${nombres} ${apellidos}`.toLowerCase();
        
        return (
          hoja.id_hoja.toString().includes(term) ||
          idPlataforma.includes(term) ||
          placaVehiculo.includes(term) ||
          nombreCompleto.includes(term)
        );
      });
    }

    setFilteredHojas(filtered);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAutorizar = (hoja) => {
    setSelectedHoja(hoja);
    setShowModalAutorizacion(true);
  };

  const handleVerFotos = (hoja) => {
    setSelectedHoja(hoja);
    setShowModalFotos(true);
  };

  const handleAutorizacionSuccess = () => {
    setShowModalAutorizacion(false);
    setSelectedHoja(null);
    loadHojas(); // Recargar la lista
  };

  const handleCloseModals = () => {
    setShowModalAutorizacion(false);
    setShowModalFotos(false);
    setSelectedHoja(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'ING': return 'bg-yellow-100 text-yellow-800';
      case 'AUT': return 'bg-green-100 text-green-800';
      case 'CAN': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoText = (estado) => {
    switch (estado) {
      case 'ING': return 'Ingresado';
      case 'AUT': return 'Autorizado';
      case 'CAN': return 'Cancelado';
      default: return estado;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb 
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Operaciones', href: '/operaciones' },
            { label: 'Salidas', href: '/operaciones/salidas' },
            { label: 'Hojas de Salida', href: '/operaciones/salidas/autorizacion-hojas' }
          ]}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Hojas de Salida</h1>
            <p className="text-gray-600 mt-1">Gestionar autorización/cancelación de Hojas de Salida pendientes</p>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Búsqueda general */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por No. Hoja, Plataforma, Placa, Piloto..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtro por No. Hoja */}
              <input
                type="text"
                placeholder="No. Hoja"
                value={filtros.no_hoja}
                onChange={(e) => handleFilterChange('no_hoja', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Filtro por Plataforma */}
              <select
                value={filtros.plataforma}
                onChange={(e) => handleFilterChange('plataforma', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las plataformas</option>
                <option value="UBER">UBER</option>
                <option value="YANGO">YANGO</option>
              </select>

              {/* Filtro por Estado */}
              <select
                value={filtros.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ING">Ingresado</option>
                <option value="AUT">Autorizado</option>
                <option value="CAN">Cancelado</option>
                <option value="">Todos los estados</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={loadHojas}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                Mostrando {filteredHojas.length} de {hojas.length} hojas de salida
              </div>
            </div>
          </div>

          {/* Tabla de Hojas */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hoja/Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Hoja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Cargando hojas...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredHojas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron hojas de salida
                    </td>
                  </tr>
                ) : (
                  filteredHojas.map((hoja) => (
                    <tr key={hoja.id_hoja} className="hover:bg-gray-50">
                      {/* Hoja/Vehículo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{hoja.id_plataforma}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Hoja #{hoja.id_hoja}
                            </div>
                            <div className="text-sm text-gray-500">
                              {hoja.placa_vehiculo} - {hoja.marca_vehiculo} {hoja.modelo}
                            </div>
                            <div className="text-sm text-gray-500">
                              {hoja.nombres} {hoja.apellidos}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Items con observaciones */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {hoja.items_con_observaciones.length > 0 ? (
                            <div className="space-y-1">
                              {hoja.items_con_observaciones.slice(0, 2).map((item, index) => (
                                <div key={index} className="text-xs bg-yellow-50 px-2 py-1 rounded">
                                  {item.desc_check}: {item.anotacion}
                                </div>
                              ))}
                              {hoja.items_con_observaciones.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{hoja.items_con_observaciones.length - 2} más...
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Sin observaciones</span>
                          )}
                        </div>
                      </td>

                      {/* Fecha Hoja */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(hoja.fe_registro)}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(hoja.estado)}`}>
                          {getEstadoText(hoja.estado)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {hoja.estado === 'ING' && (
                            <button
                              onClick={() => handleAutorizar(hoja)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Autorizar/Cancelar"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleVerFotos(hoja)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Ver Fotos"
                          >
                            <Camera className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Autorización */}
      <ModalAutorizacion
        isOpen={showModalAutorizacion}
        onClose={handleCloseModals}
        onSuccess={handleAutorizacionSuccess}
        hoja={selectedHoja}
      />

      {/* Modal de Fotos */}
      <ModalFotosAutorizacion
        isOpen={showModalFotos}
        onClose={handleCloseModals}
        hoja={selectedHoja}
      />
    </div>
  );
};

export default AutorizacionHojasES;
