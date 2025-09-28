import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import MainNavigation from '../../../components/MainNavigation';
import Breadcrumb from '../../../components/Breadcrumb';
import HeaderSection from '../../../components/HojasES/HeaderSection';
import ItemsList from '../../../components/HojasES/ItemsList';
import ItemsRevisados from '../../../components/HojasES/ItemsRevisados';
import ModalAnotaciones from '../../../components/HojasES/ModalAnotaciones';
import ModalFotos from '../../../components/HojasES/ModalFotos';
import ModalFotoItem from '../../../components/HojasES/ModalFotoItem';
import ModalConfirmacionHoja from '../../../components/HojasES/ModalConfirmacionHoja';
import axiosInstance from '../../../utils/axiosConfig';

const HojaES = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFotosModal, setShowFotosModal] = useState(false);
  const [showFotoItemModal, setShowFotoItemModal] = useState(false);
  const [showConfirmacionModal, setShowConfirmacionModal] = useState(false);
  const [numeroHojaModal, setNumeroHojaModal] = useState('');
  const [selectedItemForFoto, setSelectedItemForFoto] = useState(null);
  
  // Estados del encabezado
  const [clienteSeleccionado, setClienteSeleccionado] = useState('UBR');
  const [plataformaSeleccionada, setPlataformaSeleccionada] = useState('UBER');
  const [pilotoSeleccionado, setPilotoSeleccionado] = useState('');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Nuevos estados para los elementos agregados
  const [numeroHoja, setNumeroHoja] = useState('');
  const [porcentajeTanque, setPorcentajeTanque] = useState(0);
  const [valeSeleccionado, setValeSeleccionado] = useState('');
  
  // Estados para fotos
  const [fotosCargadas, setFotosCargadas] = useState(0);
  const [fotosFaltantes, setFotosFaltantes] = useState(5);
  const [fotosData, setFotosData] = useState([]);
  
  // Estados para fotos de items en memoria
  const [fotosItemsPendientes, setFotosItemsPendientes] = useState([]);
  
  // Estados de datos
  const [pilotos, setPilotos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [itemsChecklist, setItemsChecklist] = useState([]);
  const [itemsRevisados, setItemsRevisados] = useState([]);
  const [kilometrajeActual, setKilometrajeActual] = useState(0);
  
  // Estados de validación
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Actualizar plataforma cuando cambie el cliente
  useEffect(() => {
    console.log('🔍 Cliente seleccionado:', clienteSeleccionado);
    if (clienteSeleccionado === 'UBR') {
      setPlataformaSeleccionada('UBER');
      console.log('✅ Plataforma establecida: UBER');
    } else if (clienteSeleccionado === 'YANGO') {
      setPlataformaSeleccionada('YANGO');
      console.log('✅ Plataforma establecida: YANGO');
    } else {
      setPlataformaSeleccionada('UBER'); // Default
      console.log('⚠️ Plataforma por defecto: UBER');
    }
  }, [clienteSeleccionado]);

  // Validar formulario
  useEffect(() => {
    validateForm();
  }, [pilotoSeleccionado, vehiculoSeleccionado, kilometraje, clienteSeleccionado, porcentajeTanque, fotosCargadas, valeSeleccionado]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [pilotosRes, vehiculosRes, itemsRes] = await Promise.all([
        axiosInstance.get('/api/hoja-es/pilotos'),
        axiosInstance.get('/api/hoja-es/vehiculos'),
        axiosInstance.get('/api/hoja-es/items')
      ]);

      setPilotos(pilotosRes.data.data || []);
      setVehiculos(vehiculosRes.data.data || []);
      
      // Cargar items de checklist desde la base de datos
      const itemsData = itemsRes.data.data || [];
      console.log('Items cargados desde FLVEH_M007:', itemsData);
      setItemsChecklist(itemsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!pilotoSeleccionado) newErrors.piloto = 'Piloto es requerido';
    if (!vehiculoSeleccionado) newErrors.vehiculo = 'Vehículo es requerido';
    if (!kilometraje) newErrors.kilometraje = 'Kilometraje es requerido';
    if (kilometraje && parseInt(kilometraje) < kilometrajeActual) {
      newErrors.kilometraje = `El kilometraje no puede ser menor a ${kilometrajeActual}`;
    }
    if (!clienteSeleccionado) newErrors.cliente = 'Cliente es requerido';
    
    // Validaciones para los nuevos campos
    if (porcentajeTanque === 0) newErrors.porcentajeTanque = 'Nivel de combustible es requerido';
    if (fotosCargadas !== 5) newErrors.fotos = 'Se requieren 5 fotos de la motocicleta';
    if (!valeSeleccionado) newErrors.valeSeleccionado = 'Debe seleccionar un vale de combustible';

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  };

  const handleVehiculoChange = async (vehiculoId) => {
    setVehiculoSeleccionado(vehiculoId);
    setKilometraje('');
    
    if (vehiculoId) {
      try {
        const response = await axiosInstance.get(`/api/hoja-es/vehiculo/${vehiculoId}/kilometraje`);
        setKilometrajeActual(response.data.data.kilometraje);
        setKilometraje(response.data.data.kilometraje.toString());
      } catch (error) {
        console.error('Error getting vehiculo kilometraje:', error);
      }
    }
  };

  const handlePassItem = (item) => {
    setItemsChecklist(prev => prev.filter(i => i.id_check !== item.id_check));
    setItemsRevisados(prev => [...prev, { ...item, anotacion: '' }]);
  };

  const handleQuitarItem = (item) => {
    setItemsRevisados(prev => prev.filter(i => i.id_check !== item.id_check));
    setItemsChecklist(prev => [...prev, { ...item, anotacion: '' }]);
  };

  const handleAnotacion = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleSaveAnotacion = (anotacion) => {
    setItemsRevisados(prev => 
      prev.map(item => 
        item.id_check === selectedItem.id_check 
          ? { ...item, anotacion }
          : item
      )
    );
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleOpenFotosModal = () => {
    setShowFotosModal(true);
  };

  const handleSaveFotos = async (fotosArray) => {
    try {
      setLoading(true);
      
      // Convertir archivos a base64
      const fotosConBase64 = await Promise.all(
        fotosArray.map(async (foto) => {
          const base64 = await fileToBase64(foto.foto);
          return {
            ...foto,
            foto: base64
          };
        })
      );

      // Almacenar fotos en memoria (no en BD aún)
      setFotosData(fotosConBase64);
      setFotosCargadas(5);
      setFotosFaltantes(0);
      
      // Cerrar modal
      setShowFotosModal(false);
      
      // Mostrar mensaje de éxito
      alert('Fotos guardadas en memoria. Se guardarán en BD al finalizar la hoja.');
      
    } catch (error) {
      console.error('Error processing fotos:', error);
      alert('Error al procesar las fotos');
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remover el prefijo data:image/...
      reader.onerror = error => reject(error);
    });
  };

  const handleFotoItem = (item) => {
    setSelectedItemForFoto(item);
    setShowFotoItemModal(true);
  };

  const handleSaveFotoItem = async (fotoData) => {
    try {
      setLoading(true);
      
      // Convertir archivo a base64
      const base64 = await fileToBase64(fotoData.file);

      // Almacenar foto en memoria (no en BD aún)
      const fotoItem = {
        id_check: selectedItemForFoto.id_check,
        foto: base64,
        nombre_archivo: fotoData.nombre_archivo,
        tamano_archivo: fotoData.tamano_archivo,
        tipo_mime: fotoData.tipo_mime,
        desc_check: selectedItemForFoto.desc_check
      };

      // Actualizar fotos pendientes en memoria
      setFotosItemsPendientes(prev => {
        // Remover foto existente del mismo item si existe
        const fotosFiltradas = prev.filter(f => f.id_check !== selectedItemForFoto.id_check);
        // Agregar nueva foto
        return [...fotosFiltradas, fotoItem];
      });

      // Actualizar el estado visual del item para mostrar que tiene foto
      setItemsRevisados(prev => 
        prev.map(item => 
          item.id_check === selectedItemForFoto.id_check 
            ? { ...item, tiene_foto: true }
            : item
        )
      );
      
      // Mostrar mensaje de éxito
      alert('Foto del item guardada en memoria. Se guardará en BD al finalizar la hoja.');
      
    } catch (error) {
      console.error('Error processing foto item:', error);
      alert('Error al procesar la foto del item');
    } finally {
      setLoading(false);
    }
  };

  const handleListo = async () => {
    if (!isFormValid || itemsRevisados.length === 0) {
      alert('Por favor complete todos los campos requeridos y revise al menos un item');
      return;
    }

    setLoading(true);
    try {
      // Crear la hoja principal (el backend maneja la generación del ID internamente)
      const hojaData = {
        id_plataforma: clienteSeleccionado,
        id_piloto: parseInt(pilotoSeleccionado),
        id_vehiculo: parseInt(vehiculoSeleccionado),
        placa_id: vehiculos.find(v => v.id_vehiculo === parseInt(vehiculoSeleccionado))?.placa_id || '',
        lectura_km_num: parseInt(kilometraje),
        observaciones,
        porcentaje_tanque: porcentajeTanque,
        lectura_km_pic: '', // Ya no usamos esta imagen individual
        id_vale: parseInt(valeSeleccionado) // Agregar el vale seleccionado
      };
 
      console.log('📊 Datos a enviar:', hojaData);
      console.log('📊 Validación de tipos:', {
        id_plataforma: typeof hojaData.id_plataforma,
        id_piloto: typeof hojaData.id_piloto,
        id_vehiculo: typeof hojaData.id_vehiculo,
        placa_id: typeof hojaData.placa_id,
        lectura_km_num: typeof hojaData.lectura_km_num,
        porcentaje_tanque: typeof hojaData.porcentaje_tanque
      });

      const hojaResponse = await axiosInstance.post('/api/hoja-es/hoja', hojaData);
      
      if (!hojaResponse.data.success) {
        throw new Error(hojaResponse.data.error || 'Error al crear la hoja de salida');
      }
      
      if (!hojaResponse.data.data || !hojaResponse.data.data.id_hoja) {
        throw new Error('No se recibió el ID de hoja del backend');
      }
      
      const id_hoja = hojaResponse.data.data.id_hoja;
      
      // Actualizar el estado local con el número generado por el backend
      setNumeroHoja(id_hoja);

      // Agregar items revisados
      for (const item of itemsRevisados) {
        await axiosInstance.post('/api/hoja-es/item-revisado', {
          id_hoja,
          id_check: item.id_check,
          anotacion: item.anotacion || ''
        });
      }

      // Guardar fotos de motocicleta en la BD (ahora que tenemos id_hoja)
      if (fotosData.length === 5) {
        try {
          await axiosInstance.post('/api/hoja-es/subir-fotos', {
            id_hoja,
            fotos: fotosData
          });
        } catch (error) {
          console.error('Error guardando fotos de motocicleta:', error);
        }
      }

      // Guardar fotos de items en la BD (ahora que tenemos id_hoja)
      for (const fotoItem of fotosItemsPendientes) {
        try {
          await axiosInstance.post('/api/hoja-es/subir-foto-item', {
            id_hoja,
            id_check: fotoItem.id_check,
            foto: fotoItem.foto,
            nombre_archivo: fotoItem.nombre_archivo,
            tamano_archivo: fotoItem.tamano_archivo,
            tipo_mime: fotoItem.tipo_mime
          });
        } catch (error) {
          console.error(`Error guardando foto del item ${fotoItem.desc_check}:`, error);
        }
      }

      // Resetear formulario
      setPilotoSeleccionado('');
      setVehiculoSeleccionado('');
      setKilometraje('');
      setObservaciones('');
      setPorcentajeTanque(0);
      setFotosCargadas(0);
      setFotosFaltantes(5);
      setFotosData([]);
      setFotosItemsPendientes([]);
      setNumeroHoja('');
      setItemsRevisados([]);
      
      // Recargar items de checklist desde la base de datos
      try {
        const itemsRes = await axiosInstance.get('/api/hoja-es/items');
        setItemsChecklist(itemsRes.data.data || []);
      } catch (error) {
        console.error('Error reloading items:', error);
      }
      
      // Mostrar modal de confirmación después de que todo esté procesado
      console.log('📋 Mostrando modal con numeroHoja:', id_hoja);
      // Establecer el número de hoja para el modal
      setNumeroHojaModal(id_hoja);
      setShowConfirmacionModal(true);
      
    } catch (error) {
      console.error('Error creating hoja:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Error al crear la hoja de salida';
      if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (window.confirm('¿Está seguro de que desea cancelar? Se perderán todos los datos ingresados.')) {
      setPilotoSeleccionado('');
      setVehiculoSeleccionado('');
      setKilometraje('');
      setObservaciones('');
      setPorcentajeTanque(0);
      setFotosCargadas(0);
      setFotosFaltantes(5);
      setFotosData([]);
      setFotosItemsPendientes([]);
      setNumeroHoja('');
      setItemsRevisados([]);
      
      // Recargar items de checklist desde la base de datos
      try {
        const itemsRes = await axiosInstance.get('/api/hoja-es/items');
        setItemsChecklist(itemsRes.data.data || []);
      } catch (error) {
        console.error('Error reloading items:', error);
      }
    }
  };

  const handleCerrarConfirmacion = () => {
    setShowConfirmacionModal(false);
    setNumeroHojaModal('');
  };

  if (loading && pilotos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb 
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Operaciones', href: '/operaciones' },
            { label: 'Salidas', href: '/operaciones/salidas' },
            { label: 'Hoja de Salida', href: '/operaciones/salidas/hoja-es' }
          ]}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Creación de la Salida</h1>
          
          {/* Sección de Encabezado */}
          <HeaderSection
            clienteSeleccionado={clienteSeleccionado}
            setClienteSeleccionado={setClienteSeleccionado}
            pilotoSeleccionado={pilotoSeleccionado}
            setPilotoSeleccionado={setPilotoSeleccionado}
            vehiculoSeleccionado={vehiculoSeleccionado}
            setVehiculoSeleccionado={handleVehiculoChange}
            kilometraje={kilometraje}
            setKilometraje={setKilometraje}
            observaciones={observaciones}
            setObservaciones={setObservaciones}
            pilotos={pilotos}
            vehiculos={vehiculos}
            kilometrajeActual={kilometrajeActual}
            errors={errors}
            // Nuevos props
            numeroHoja={numeroHoja}
            setNumeroHoja={setNumeroHoja}
            porcentajeTanque={porcentajeTanque}
            setPorcentajeTanque={setPorcentajeTanque}
            // Props para fotos
            fotosCargadas={fotosCargadas}
            fotosFaltantes={fotosFaltantes}
            onOpenFotosModal={handleOpenFotosModal}
            // Props para vales de combustible
            valeSeleccionado={valeSeleccionado}
            setValeSeleccionado={setValeSeleccionado}
          />

          {/* Secciones de Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Items a Validar */}
            <ItemsList
              items={itemsChecklist}
              onPassItem={handlePassItem}
              loading={loading}
            />

            {/* Items Revisados */}
            <ItemsRevisados
              items={itemsRevisados}
              onQuitarItem={handleQuitarItem}
              onAnotacion={handleAnotacion}
              onFoto={handleFotoItem}
              loading={loading}
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={handleCancelar}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleListo}
              disabled={!isFormValid || itemsRevisados.length === 0 || loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Listo!'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Anotaciones */}
      <ModalAnotaciones
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveAnotacion}
        item={selectedItem}
      />

      {/* Modal de Fotos */}
      <ModalFotos
        isOpen={showFotosModal}
        onClose={() => setShowFotosModal(false)}
        onSave={handleSaveFotos}
        idHoja={numeroHoja}
      />

      {/* Modal de Foto de Item */}
      <ModalFotoItem
        isOpen={showFotoItemModal}
        onClose={() => {
          setShowFotoItemModal(false);
          setSelectedItemForFoto(null);
        }}
        onSave={handleSaveFotoItem}
        item={selectedItemForFoto}
        idHoja={numeroHoja}
      />

      {/* Modal de confirmación de hoja creada */}
      <ModalConfirmacionHoja
        isOpen={showConfirmacionModal}
        onClose={handleCerrarConfirmacion}
        numeroHoja={numeroHojaModal}
        plataforma={plataformaSeleccionada}
      />
    </div>
  );
};

export default HojaES;
