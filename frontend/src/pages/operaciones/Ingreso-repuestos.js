import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import MainNavigation from '../../components/MainNavigation';
import Breadcrumb from '../../components/Breadcrumb';


//estos son los componentes de debug que se han comentado por el momento
//ya que si se habilitan, se puede ver que la conexión a la API esta funcionando correctamente
//pero se debe habilitar para poder hacer pruebas de debug

//import ApiStatus from '../../components/ApiStatus';
//import HeadersDebug from '../../components/HeadersDebug';
//import ConnectionTest from '../../components/ConnectionTest';
//import AuthDebug from '../../components/AuthDebug';
//import LoginDebug from '../../components/LoginDebug';

import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MoreVertical,
  Calendar,
  User,
  MapPin,
  Save,
  X,
  RefreshCw,
  Bike
} from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';
import API_CONFIG from '../../config/api';
import { getEnvConfig } from '../../config/environment';

 
const IngresoRepuestos = () => {
  const { user } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSede, setEditingSede] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sedeToDelete, setSedeToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    id_empresa: 1,
    cod_sede: '',
    cod_abreviado: 'LOC',
    desc_sede: '',
    tipo_sede: '',
    observaciones: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const breadcrumbItems = [
    { id: 'catalogos', label: 'Catálogos', path: '/catalogos' },
    { id: 'sedes', label: 'Sedes', path: '/catalogos/sedes' }
  ];

  // Estados disponibles
  const estados = [
    { value: 'ACT', label: 'Activo' },
    { value: 'SUP', label: 'Suplente' },
    { value: 'TMP', label: 'Temporal' },
    { value: 'MED', label: 'Suspension Medica' },
    { value: 'RET', label: 'Retiro' },
    { value: 'TER', label: 'Terminado' }
  ];

  // Tipos de vehículo
  const tiposSede = [
    'LOC',
    'EXT'
  ];

  // Combustibles
  const combustibles = [
    'Gasolina',
    'Diesel',
    'Eléctrico',
    'Híbrido',
    'Gas Natural',
    'Otro'
  ];

  // Cargar Sedes
  const loadSedes = async () => {
    setLoading(true);
    try {
      console.log('🚀 Cargando sedes desde:', API_CONFIG.SEDES.LIST);
      const response = await axiosInstance.get(API_CONFIG.SEDES.LIST);
      console.log('✅ Respuesta de sedes:', response.data);
      
      if (response.data.success) {
        setSedes(response.data.data);
        console.log(`📊 ${response.data.data.length} sedes cargados`);
      } else {
        console.warn('⚠️ Respuesta sin éxito:', response.data);
        setSedes([]);
      }
    } catch (error) {
      console.error('❌ Error cargando sedes:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      // Mostrar mensaje de error más específico
      if (error.response?.status === 401) {
        alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 500) {
        alert('Error del servidor. Por favor, intenta más tarde.');
      } else if (error.code === 'ECONNABORTED') {
        alert('Timeout de conexión. Verifica tu conexión a internet.');
      } else if (!error.response) {
        alert('Error de conexión. Verifica que el servidor esté funcionando.');
      } else {
        alert(`Error ${error.response.status}: ${error.response.data?.error || 'Error desconocido'}`);
      }
      
      setSedes([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar sedes al montar el componente
  useEffect(() => {
    loadSedes();
  }, []);

  // Filtrar sedes
  const filteredSedes = sedes.filter(sede => {
    const matchesSearch = sede.desc_sede?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sede.tipo_sede?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sede.cod_abreviado?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || sede.desc_sede === filterStatus;
    const matchesType = filterType === 'all' || sede.tipo_sede === filterType;
    
    return matchesSearch && matchesStatus;// && matchesType;
  });

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.cod_sede) errors.cod_sede = 'El código de la sede es requerido';
    if (!formData.cod_abreviado) errors.cod_abreviado = 'El código abreviado es requerido';
    if (!formData.desc_sede.trim()) errors.desc_sede = 'El nombre de la sede es requerido';
    if (!formData.tipo_sede.trim()) errors.tipo_sede = 'El tipo de sede es requerido';
    if (!formData.observaciones.trim()) errors.observaciones = 'Las observaciones son requeridas';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Abrir formulario para nuevo vehículo
  const openNewForm = () => {
    setFormData({
      id_empresa: 1,
      cod_sede: '',
      cod_abreviado: 'LOC',
      desc_sede: '',
      tipo_sede: '',
      observaciones: ''
    });
    setFormErrors({});
    setEditingSede(null);
    setShowForm(true);
  };

  // Abrir formulario para editar
  const openEditForm = (sede) => {
    setFormData({
      id_empresa: sede.id_empresa || 1,
      cod_sede: sede.cod_sede || '',
      cod_abreviado: sede.cod_abreviado || 'LOC',
      desc_sede: sede.desc_sede || '',
      tipo_sede: sede.tipo_sede || '',
      observaciones: sede.observaciones || ''
    });
    setFormErrors({});
    setEditingSede(sede);
    setShowForm(true);
  };

  // Cerrar formulario
  const closeForm = () => {
    setShowForm(false);
    setEditingSede(null);
    setFormData({
      id_empresa: 1,
      cod_sede: '',
      cod_abreviado: 'LOC',
      desc_sede: '',
      tipo_sede: '',
      observaciones: ''
    });
    setFormErrors({});
  };

  // Guardar sede
  const saveSede = async () => {
    console.log('<<Entra>>', formData);
    if (!validateForm()) return;

    try {
      console.log('🚀 Guardando sede:', formData);
      
        if (editingSede) {
        // Actualizar
        console.log('📝 Actualizando sede ID:', editingSede.id_sede);
        const response = await axiosInstance.put(API_CONFIG.SEDES.UPDATE(editingSede.id_sede), formData);
        console.log('✅ Sede actualizada:', response.data);
        
        if (response.data.success) {
          alert('Sede actualizada exitosamente');
          await loadSedes();
          closeForm();
        }
      } else {
        // Crear nuevo
        console.log('🆕 Creando nuevo sede');
        const response = await axiosInstance.post(API_CONFIG.SEDES.CREATE, formData);
        console.log('✅ Sede creada:', response.data);
        
        if (response.data.success) {
          alert('Sede creada exitosamente');
          await loadSedes();
          closeForm();
        }
      }
    } catch (error) {
      console.error('❌ Error guardando sede:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      // Mostrar mensaje de error más específico
      if (error.response?.status === 400) {
        const errorMsg = error.response.data?.error || 'Datos inválidos';
        alert(`Error de validación: ${errorMsg}`);
      } else if (error.response?.status === 401) {
        alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 500) {
        alert('Error del servidor. Por favor, intenta más tarde.');
      } else if (error.code === 'ECONNABORTED') {
        alert('Timeout de conexión. Verifica tu conexión a internet.');
      } else if (!error.response) {
        alert('Error de conexión. Verifica que el servidor esté funcionando.');
      } else {
        alert(`Error ${error.response.status}: ${error.response.data?.error || 'Error desconocido'}`);
      }
    }
  };

  // Eliminar vehículo
  const deleteSede = async (id) => {
    try {
      const response = await axiosInstance.delete(API_CONFIG.SEDES.DELETE(id));
      if (response.data.success) {
        await loadSedes();
      }
    } catch (error) {
      console.error('Error deleting sede:', error);
    }
  };

  // Mostrar confirmación de eliminación
  const showDeleteConfirmation = (sede) => {
    setSedeToDelete(sede);
    setShowDeleteConfirm(true);
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (sedeToDelete) {
      await deleteSede(sedeToDelete.id_sede);
      setShowDeleteConfirm(false);
      setSedeToDelete(null);
    }
  };

  // Cancelar eliminación
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSedeToDelete(null);
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACT':
        return 'bg-green-100 text-green-800';
      case 'SUP':
        return 'bg-yellow-100 text-purple-800';
      case 'TMP':
        return 'bg-red-100 text-red-800';
      case 'TER':
        return 'bg-orange-100 text-red-800';
      case 'MED':
        return 'bg-orange-100 text-yellow-800';
      case 'RET':
        return 'bg-orange-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status) => {
    const estado = estados.find(e => e.value === status);
    return estado ? estado.label : 'Desconocido';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNavigation user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Catálogo de Sedes
            </h1>
            <p className="text-slate-600">
              Administra la información de todas las sedes de la flota
            </p>

            {/* Aqui muestra el status de la API            */}
            {/*
            <div className="mt-2">
              <ApiStatus />
            </div>
            */}

            {/* Aqui muestra el status de los headers */}
            {/*
            <div className="mt-2">
              <HeadersDebug />
            </div>
            */}
            
            {/* Aqui muestra el status de la conexión */}
            <div className="mt-2">
              <button
                onClick={loadSedes}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Cargando...' : 'Recargar Sedes'}
              </button>
            </div>

            {/* Aqui muestra el status de la conexión */}
            {/*
            <div className="mt-2">
              <ConnectionTest />
            </div>
            */}

            {/* Aqui muestra el status de la autenticación */}
            {/*
            <div className="mt-2">
              <AuthDebug />
            </div>
            */}

            {/* Aqui muestra el status de la conexión */}
            {/*
            <div className="mt-2">
              <LoginDebug />
            </div>
            */}
          </div>
          
          <button 
            onClick={openNewForm}
            className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Sede</span>
          </button>
        </div>

        {/* SECCIÓN 1: FORMULARIO DE CAPTURA */}
        {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingSede ? 'Editar Sede' : 'Nueva Sede'}
              </h2>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">


              {/* Código de la Sede */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Código de la Sede *
                </label>
                <input
                  type="number"
                  name="cod_sede"
                  value={formData.cod_sede}
                  onChange={handleFormChange}
                  className={`input ${formErrors.cod_sede ? 'border-red-500' : ''}`}
                  placeholder="100"
                />
                {formErrors.cod_sede && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.cod_sede}</p>
                )}
              </div>

              {/* Código Abreviado */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Código Abreviado *
                </label>
                <input
                  type="text"
                  name="cod_abreviado"
                  value={formData.cod_abreviado}
                  onChange={handleFormChange}
                  className={`input ${formErrors.cod_abreviado ? 'border-red-500' : ''}`}
                  placeholder="LOC"
                />
                {formErrors.cod_abreviado && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.cod_abreviado}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción de la Sede *
                </label>
                <input
                  type="text"
                  name="desc_sede"
                  value={formData.desc_sede}
                  onChange={handleFormChange}
                  className={`input ${formErrors.desc_sede ? 'border-red-500' : ''}`}
                  placeholder="Sede de Guatemala"
                />
                {formErrors.desc_sede && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.desc_sede}</p>
                )}
              </div>

              {/* Tipo de Sede */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Sede *
                </label>
                <input
                  type="text"
                  name="tipo_sede"
                  value={formData.tipo_sede}
                  onChange={handleFormChange}
                  className={`input ${formErrors.tipo_sede ? 'border-red-500' : ''}`}
                  placeholder="LOC"
                />
                {formErrors.tipo_sede && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.tipo_sede}</p>
                )}
              </div>

            </div>


            {/* Observaciones */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleFormChange}
                rows="3"
                className="input w-full"
                placeholder="Observaciones adicionales..."
              />
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-200">
              <button
                onClick={closeForm}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={saveSede}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingSede ? 'Actualizar' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: LISTADO DE REGISTROS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Filtros y búsqueda */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por Sede, Tipo de Sede..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input max-w-xs"
            >
              <option value="all">Todos los tipos</option>
              {tiposSede.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            <button
              onClick={loadSedes}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
                  </button>
              </div>

          {/* Tabla de Sedes */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Sede
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tipo de Sede
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Cargando sedes...</span>
                        <span className="text-xs text-gray-500">Verificando conexión con el servidor...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSedes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <User className="h-12 w-12 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">No se encontraron sedes</span>
                        <span className="text-xs text-gray-500">Intenta ajustar los filtros o agregar una nueva sede</span>
                        <button
                          onClick={openNewForm}
                          className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Sede
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSedes.map((sede) => (
                    <tr key={sede.id_sede} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600 fill-blue-600" />
                </div>
              </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {sede.desc_sede}
                </div>
                            <div className="text-sm text-slate-500">
                              {sede.tipo_sede}
                </div>
              </div>
                </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          <div>Tp: {sede.tipo_sede }</div>
                         { sede.cod_abreviado && <div>Cód Abrev: {sede.cod_abreviado}</div>} 
                         {/* {vehicle.kilometraje && <div>KM: {vehicle.kilometraje.toLocaleString()}</div>} */}
                </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sede.estado)}`}>
                          {getStatusText(sede.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {sede.fe_registro ? new Date(sede.fe_registro).toLocaleDateString(getEnvConfig('DATE_FORMAT')) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditForm(sede)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar"
                          >
                  <Edit className="h-4 w-4" />
                </button>
                          <button
                            onClick={() => showDeleteConfirmation(sede)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Eliminar"
                          >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>

          {/* Información de registros */}
          <div className="mt-4 text-sm text-slate-500">
            Mostrando {filteredSedes.length} de {sedes.length} sedes
            </div>
          </div>
      </main>

      {/* Confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-slate-700 mb-6">
              ¿Estás seguro de que quieres eliminar la sede "{sedeToDelete?.id_sede}"?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="btn-danger"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngresoRepuestos; 