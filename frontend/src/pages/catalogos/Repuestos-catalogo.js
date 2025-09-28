import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import MainNavigation from '../../components/MainNavigation';
import Breadcrumb from '../../components/Breadcrumb';
import { 
  Package, 
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
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';
import API_CONFIG from '../../config/api';
import { getEnvConfig } from '../../config/environment';

const RepuestosCatalogo = () => {
  const { user } = useAuth();
  const [repuestos, setRepuestos] = useState([]);
  const [tiposVehiculos, setTiposVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTipoVehiculo, setFilterTipoVehiculo] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [repuestoToDelete, setRepuestoToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    id_empresa: 1,
    id_sede: 1,
    tipo_vehiculo: '',
    cod_articulo: '',
    cod_barras: '',
    descripcion: '',
    unidad_medida: '',
    punto_reorden: '',
    anotaciones: '',
    estatus: 'ACT'
  });

  const [formErrors, setFormErrors] = useState({});

  const breadcrumbItems = [
    { id: 'catalogos', label: 'Catálogos', path: '/catalogos' },
    { id: 'repuestos-catalogo', label: 'Maestro de Repuestos', path: '/catalogos/repuestos-catalogo' }
  ];

  // Estados disponibles
  const estados = [
    { value: 'ACT', label: 'Activo' },
    { value: 'INA', label: 'Inactivo' },
    { value: 'OBS', label: 'Obsoleto' }
  ];

  // Unidades de medida comunes
  const unidadesMedida = [
    'Pieza',
    'Litro',
    'Kilogramo',
    'Metro',
    'Caja',
    'Paquete',
    'Unidad',
    'Otro'
  ];

  // Cargar Repuestos
  const loadRepuestos = async () => {
    setLoading(true);
    try {
      console.log('🚀 Cargando repuestos desde:', API_CONFIG.REPUESTOS_CATALOGO.LIST);
      const response = await axiosInstance.get(API_CONFIG.REPUESTOS_CATALOGO.LIST);
      console.log('✅ Respuesta de repuestos:', response.data);
      
      if (response.data.success) {
        setRepuestos(response.data.data);
        console.log(`📊 ${response.data.data.length} repuestos cargados`);
      } else {
        console.warn('⚠️ Respuesta sin éxito:', response.data);
        setRepuestos([]);
      }
    } catch (error) {
      console.error('❌ Error cargando repuestos:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
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
      
      setRepuestos([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar tipos de vehículos
  const loadTiposVehiculos = async () => {
    try {
      const response = await axiosInstance.get(API_CONFIG.TIPOS_VEHICULOS.CATALOGO);
      setTiposVehiculos(response.data || []);
    } catch (error) {
      console.error('Error cargando tipos de vehículos:', error);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadRepuestos();
    loadTiposVehiculos();
  }, []);

  // Filtrar repuestos
  const filteredRepuestos = repuestos.filter(repuesto => {
    const matchesSearch = repuesto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repuesto.cod_articulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         repuesto.cod_barras?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || repuesto.estatus === filterStatus;
    const matchesTipoVehiculo = filterTipoVehiculo === 'all' || repuesto.tipo_vehiculo == filterTipoVehiculo;
    
    return matchesSearch && matchesStatus && matchesTipoVehiculo;
  });

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.tipo_vehiculo) errors.tipo_vehiculo = 'El tipo de vehículo es requerido';
    if (!formData.punto_reorden) errors.punto_reorden = 'El punto de reorden es requerido';
    if (formData.punto_reorden && isNaN(formData.punto_reorden)) errors.punto_reorden = 'El punto de reorden debe ser un número';
    if (formData.punto_reorden && parseFloat(formData.punto_reorden) < 0) errors.punto_reorden = 'El punto de reorden debe ser mayor o igual a 0';
    
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

  // Abrir formulario para nuevo repuesto
  const openNewForm = () => {
    setFormData({
      id_empresa: 1,
      id_sede: 1,
      tipo_vehiculo: '',
      cod_articulo: '',
      cod_barras: '',
      descripcion: '',
      unidad_medida: '',
      punto_reorden: '',
      anotaciones: '',
      estatus: 'ACT'
    });
    setFormErrors({});
    setEditingRepuesto(null);
    setShowForm(true);
  };

  // Abrir formulario para editar
  const openEditForm = (repuesto) => {
    setFormData({
      id_empresa: repuesto.id_empresa || 1,
      id_sede: repuesto.id_sede || 1,
      tipo_vehiculo: repuesto.tipo_vehiculo || '',
      cod_articulo: repuesto.cod_articulo || '',
      cod_barras: repuesto.cod_barras || '',
      descripcion: repuesto.descripcion || '',
      unidad_medida: repuesto.unidad_medida || '',
      punto_reorden: repuesto.punto_reorden ? repuesto.punto_reorden.toString() : '',
      anotaciones: repuesto.anotaciones || '',
      estatus: repuesto.estatus
    });
    setFormErrors({});
    setEditingRepuesto(repuesto);
    setShowForm(true);
  };

  // Cerrar formulario
  const closeForm = () => {
    setShowForm(false);
    setEditingRepuesto(null);
    setFormData({
      id_empresa: 1,
      id_sede: 1,
      tipo_vehiculo: '',
      cod_articulo: '',
      cod_barras: '',
      descripcion: '',
      unidad_medida: '',
      punto_reorden: '',
      anotaciones: '',
      estatus: 'ACT'
    });
    setFormErrors({});
  };

  // Guardar repuesto
  const saveRepuesto = async () => {
    console.log('<<Entra>>', formData);
    if (!validateForm()) return;

    try {
      console.log('🚀 Guardando repuesto:', formData);
      
      if (editingRepuesto) {
        // Actualizar
        console.log('📝 Actualizando repuesto ID:', editingRepuesto.id_repuesto);
        const response = await axiosInstance.put(API_CONFIG.REPUESTOS_CATALOGO.UPDATE(editingRepuesto.id_repuesto), formData);
        console.log('✅ Repuesto actualizado:', response.data);
        
        if (response.data.success) {
          alert('Repuesto actualizado exitosamente');
          await loadRepuestos();
          closeForm();
        }
      } else {
        // Crear nuevo
        console.log('🆕 Creando nuevo repuesto');
        const response = await axiosInstance.post(API_CONFIG.REPUESTOS_CATALOGO.CREATE, formData);
        console.log('✅ Repuesto creado:', response.data);
        
        if (response.data.success) {
          alert('Repuesto creado exitosamente');
          await loadRepuestos();
          closeForm();
        }
      }
    } catch (error) {
      console.error('❌ Error guardando repuesto:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
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

  // Eliminar repuesto
  const deleteRepuesto = async (id) => {
    try {
      const response = await axiosInstance.delete(API_CONFIG.REPUESTOS_CATALOGO.DELETE(id));
      if (response.data.success) {
        await loadRepuestos();
      }
    } catch (error) {
      console.error('Error deleting repuesto:', error);
    }
  };

  // Mostrar confirmación de eliminación
  const showDeleteConfirmation = (repuesto) => {
    setRepuestoToDelete(repuesto);
    setShowDeleteConfirm(true);
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (repuestoToDelete) {
      await deleteRepuesto(repuestoToDelete.id_repuesto);
      setShowDeleteConfirm(false);
      setRepuestoToDelete(null);
    }
  };

  // Cancelar eliminación
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setRepuestoToDelete(null);
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACT':
        return 'bg-green-100 text-green-800';
      case 'INA':
        return 'bg-gray-100 text-gray-800';
      case 'OBS':
        return 'bg-red-100 text-red-800';
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
              Maestro de Repuestos
            </h1>
            <p className="text-slate-600">
              Administra el catálogo de repuestos y sus especificaciones
            </p>
            
            <div className="mt-2">
              <button
                onClick={loadRepuestos}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Cargando...' : 'Recargar Repuestos'}
              </button>
            </div>
          </div>
          
          <button 
            onClick={openNewForm}
            className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Repuesto</span>
          </button>
        </div>

        {/* SECCIÓN 1: FORMULARIO DE CAPTURA */}
        {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingRepuesto ? 'Editar Repuesto' : 'Nuevo Repuesto'}
              </h2>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Tipo de Vehículo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Vehículo *
                </label>
                <select
                  name="tipo_vehiculo"
                  value={formData.tipo_vehiculo}
                  onChange={handleFormChange}
                  className={`input ${formErrors.tipo_vehiculo ? 'border-red-500' : ''}`}
                >
                  <option value="">Seleccionar tipo de vehículo</option>
                  {tiposVehiculos.map(tipo => (
                    <option key={tipo.id_tipo_vehiculo} value={tipo.id_tipo_vehiculo}>
                      {tipo.cod_abreviado} - {tipo.desc_tipo_vehiculo}
                    </option>
                  ))}
                </select>
                {formErrors.tipo_vehiculo && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.tipo_vehiculo}</p>
                )}
              </div>

              {/* Referencia */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Referencia
                </label>
                <input
                  type="text"
                  name="cod_articulo"
                  value={formData.cod_articulo}
                  onChange={handleFormChange}
                  className="input"
                  placeholder="ART001"
                  maxLength={20}
                />
              </div>

              {/* Código de Barras */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Código de Barras
                </label>
                <input
                  type="text"
                  name="cod_barras"
                  value={formData.cod_barras}
                  onChange={handleFormChange}
                  className="input"
                  placeholder="1234567890123"
                  maxLength={20}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleFormChange}
                  className="input"
                  placeholder="Filtro de aceite"
                  maxLength={50}
                />
              </div>

              {/* Unidad de Medida */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Unidad de Medida
                </label>
                <select
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleFormChange}
                  className="input"
                >
                  <option value="">Seleccionar unidad</option>
                  {unidadesMedida.map(unidad => (
                    <option key={unidad} value={unidad}>{unidad}</option>
                  ))}
                </select>
              </div>

              {/* Punto de Reorden */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Punto de Reorden *
                </label>
                <input
                  type="number"
                  name="punto_reorden"
                  value={formData.punto_reorden}
                  onChange={handleFormChange}
                  className={`input ${formErrors.punto_reorden ? 'border-red-500' : ''}`}
                  placeholder="10"
                  min="0"
                  step="0.01"
                />
                {formErrors.punto_reorden && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.punto_reorden}</p>
                )}
              </div>

              {/* Existencia - Solo visualización */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Existencia
                </label>
                <input
                  type="text"
                  value={editingRepuesto ? (editingRepuesto.existencia || 0) : '0'}
                  className="input bg-red-50 border-red-200 text-red-600 font-medium"
                  disabled={true}
                  readOnly
                />
                <p className="text-xs text-red-500 mt-1">Solo visualización</p>
              </div>

              {/* Estatus */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estatus
                </label>
                <select
                  name="estatus"
                  value={formData.estatus}
                  onChange={handleFormChange}
                  className="input"
                >
                  {estados.map(estado => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Anotaciones */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Anotaciones
              </label>
              <textarea
                name="anotaciones"
                value={formData.anotaciones}
                onChange={handleFormChange}
                rows="3"
                className="input w-full"
                placeholder="Observaciones adicionales..."
                maxLength={100}
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
                onClick={saveRepuesto}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingRepuesto ? 'Actualizar' : 'Guardar'}</span>
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
                placeholder="Buscar por descripción, código de artículo, código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input max-w-xs"
            >
              <option value="all">Todos los estatus</option>
              {estados.map(estado => (
                <option key={estado.value} value={estado.value}>{estado.label}</option>
              ))}
            </select>

            <select
              value={filterTipoVehiculo}
              onChange={(e) => setFilterTipoVehiculo(e.target.value)}
              className="input max-w-xs"
            >
              <option value="all">Todos los tipos</option>
              {tiposVehiculos.map(tipo => (
                <option key={tipo.id_tipo_vehiculo} value={tipo.id_tipo_vehiculo}>
                  {tipo.cod_abreviado} - {tipo.desc_tipo_vehiculo}
                </option>
              ))}
            </select>

            <button
              onClick={loadRepuestos}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Tabla de Repuestos */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tipo de Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Código de Artículo / Código de Barras
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Existencia / Reorden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estatus
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
                    <td colSpan="7" className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Cargando repuestos...</span>
                        <span className="text-xs text-gray-500">Verificando conexión con el servidor...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRepuestos.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Package className="h-12 w-12 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">No se encontraron repuestos</span>
                        <span className="text-xs text-gray-500">Intenta ajustar los filtros o agregar un nuevo repuesto</span>
                        <button
                          onClick={openNewForm}
                          className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Repuesto
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRepuestos.map((repuesto) => (
                    <tr key={repuesto.id_repuesto} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Package className="h-6 w-6 text-blue-600 fill-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {repuesto.descripcion || 'Sin descripción'}
                            </div>
                            <div className="text-sm text-slate-500">
                              {repuesto.unidad_medida && `Unidad: ${repuesto.unidad_medida}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {repuesto.tipo_vehiculo_display || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {repuesto.cod_articulo && <div>Código: {repuesto.cod_articulo}</div>}
                          {repuesto.cod_barras && <div>Código: {repuesto.cod_barras}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-red-600 font-medium">
                            Existencia: {repuesto.existencia || 0}
                          </div>
                          <div className="text-slate-900">
                            Reorden: {repuesto.punto_reorden}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(repuesto.estatus)}`}>
                          {getStatusText(repuesto.estatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {repuesto.fe_registro ? new Date(repuesto.fe_registro).toLocaleDateString(getEnvConfig('DATE_FORMAT')) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openEditForm(repuesto)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => showDeleteConfirmation(repuesto)}
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
            Mostrando {filteredRepuestos.length} de {repuestos.length} repuestos
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
              ¿Estás seguro de que quieres eliminar el repuesto "{repuestoToDelete?.descripcion || repuestoToDelete?.id_repuesto}"?
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

export default RepuestosCatalogo;
