import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import HeaderSection from '../../../components/HojaEN/HeaderSection';
import ChecklistSection from '../../../components/HojaEN/ChecklistSection';
import ItemsRevisadosSection from '../../../components/HojaEN/ItemsRevisadosSection';
import axiosInstance from '../../../utils/axiosConfig';
import '../../../styles/hoja-en.css';

const HojaEN = () => {
  // Estados del formulario
  const [pilotoSeleccionado, setPilotoSeleccionado] = useState('');
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState('');
  const [hojaSalidaSeleccionada, setHojaSalidaSeleccionada] = useState(null);
  const [kilometraje, setKilometraje] = useState('');
  const [kilometrajeMinimo, setKilometrajeMinimo] = useState(0);
  const [nivelCombustible, setNivelCombustible] = useState('');
  const [montoRecaudado, setMontoRecaudado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fotosData, setFotosData] = useState([]);

  // Estados del checklist
  const [itemsRevisados, setItemsRevisados] = useState([]);
  const [fotosItemsPendientes, setFotosItemsPendientes] = useState([]);

  // Estados de la UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showConfirmacionModal, setShowConfirmacionModal] = useState(false);
  const [numeroHojaModal, setNumeroHojaModal] = useState(null);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!hojaSalidaSeleccionada) newErrors.hojaSalida = 'Hoja de Salida es requerida';
    if (!kilometraje) newErrors.kilometraje = 'Kilometraje es requerido';
    if (kilometraje && parseInt(kilometraje) < kilometrajeMinimo) {
      newErrors.kilometraje = `El kilometraje no puede ser menor a ${kilometrajeMinimo.toLocaleString()} km`;
    }
    if (!nivelCombustible) newErrors.nivelCombustible = 'Nivel de combustible es requerido';
    if (!montoRecaudado || parseFloat(montoRecaudado) <= 0) {
      newErrors.montoRecaudado = 'Monto recaudado debe ser mayor a 0';
    }
    if (fotosData.length !== 5) newErrors.fotos = 'Se requieren 5 fotos de la motocicleta';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambio de items revisados
  const handleItemToggle = (item, isChecked) => {
    // Esta función se puede usar para lógica adicional si es necesaria
  };

  // Manejar cambio de fotos
  const handleFotosChange = (fotos) => {
    setFotosData(fotos);
  };

  // Manejar envío del formulario
  const handleListo = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const hojaData = {
        id_hoja_salida: hojaSalidaSeleccionada.id_hoja,
        lectura_km_num: parseInt(kilometraje),
        porcentaje_tanque: parseFloat(nivelCombustible),
        monto_recaudado: parseFloat(montoRecaudado),
        observaciones: observaciones,
        items_revisados: itemsRevisados,
        fotos_data: fotosData,
        fotos_items_data: fotosItemsPendientes
      };

      const response = await axiosInstance.post('/api/hoja-en/hoja', hojaData);
      
      if (response.data.success) {
        setNumeroHojaModal(response.data.data.id_hoja);
        setShowConfirmacionModal(true);
      } else {
        alert('Error al crear la hoja de entrada: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error creating hoja de entrada:', error);
      alert('Error al crear la hoja de entrada');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cancelación
  const handleCancelar = () => {
    if (window.confirm('¿Está seguro de que desea cancelar? Se perderán todos los datos ingresados.')) {
      // Resetear formulario
      setPilotoSeleccionado('');
      setVehiculoSeleccionado('');
      setHojaSalidaSeleccionada(null);
      setKilometraje('');
      setKilometrajeMinimo(0);
      setNivelCombustible('');
      setMontoRecaudado('');
      setObservaciones('');
      setFotosData([]);
      setItemsRevisados([]);
      setFotosItemsPendientes([]);
      setErrors({});
    }
  };

  // Cerrar modal de confirmación
  const handleCloseModal = () => {
    setShowConfirmacionModal(false);
    setNumeroHojaModal(null);
    // Resetear formulario después de éxito
    setPilotoSeleccionado('');
    setVehiculoSeleccionado('');
    setHojaSalidaSeleccionada(null);
    setKilometraje('');
    setKilometrajeMinimo(0);
    setNivelCombustible('');
    setMontoRecaudado('');
    setObservaciones('');
    setFotosData([]);
    setItemsRevisados([]);
    setFotosItemsPendientes([]);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="hoja-en-header">
          <h1 className="text-3xl font-bold text-white">Hoja de Entrada</h1>
          <p className="mt-2 text-white opacity-90">
            Complete la información para crear una nueva hoja de entrada
          </p>
        </div>

        {/* Formulario */}
        <div className="space-y-6">
          {/* Sección de encabezado */}
          <HeaderSection
            pilotoSeleccionado={pilotoSeleccionado}
            setPilotoSeleccionado={setPilotoSeleccionado}
            vehiculoSeleccionado={vehiculoSeleccionado}
            setVehiculoSeleccionado={setVehiculoSeleccionado}
            hojaSalidaSeleccionada={hojaSalidaSeleccionada}
            setHojaSalidaSeleccionada={setHojaSalidaSeleccionada}
            kilometraje={kilometraje}
            setKilometraje={setKilometraje}
            kilometrajeMinimo={kilometrajeMinimo}
            setKilometrajeMinimo={setKilometrajeMinimo}
            nivelCombustible={nivelCombustible}
            setNivelCombustible={setNivelCombustible}
            montoRecaudado={montoRecaudado}
            setMontoRecaudado={setMontoRecaudado}
            observaciones={observaciones}
            setObservaciones={setObservaciones}
            fotosData={fotosData}
            setFotosData={setFotosData}
            onFotosChange={handleFotosChange}
            errors={errors}
          />

          {/* Secciones de Items - Layout de 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Items a Validar */}
            <ChecklistSection
              itemsRevisados={itemsRevisados}
              setItemsRevisados={setItemsRevisados}
              onItemToggle={handleItemToggle}
              errors={errors}
            />

            {/* Items Revisados */}
            <ItemsRevisadosSection
              hojaSalidaSeleccionada={hojaSalidaSeleccionada}
              itemsRevisados={itemsRevisados}
              setItemsRevisados={setItemsRevisados}
              onItemToggle={handleItemToggle}
              fotosItemsPendientes={fotosItemsPendientes}
              setFotosItemsPendientes={setFotosItemsPendientes}
              errors={errors}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              onClick={handleCancelar}
              className="hoja-en-button secondary"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              onClick={handleListo}
              disabled={loading}
              className="hoja-en-button"
            >
              {loading ? (
                <>
                  <div className="hoja-en-spinner w-4 h-4"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Listo
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal de confirmación */}
        {showConfirmacionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="hoja-en-modal">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  ¡Hoja de Entrada Creada!
                </h3>
                <p className="text-gray-600 mb-6">
                  Entrada ha sido creada exitosamente, para la Salida:
                </p>
                <p className="numero-hoja">
                  {numeroHojaModal}
                </p>
                <button
                  onClick={handleCloseModal}
                  className="hoja-en-button"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HojaEN;
