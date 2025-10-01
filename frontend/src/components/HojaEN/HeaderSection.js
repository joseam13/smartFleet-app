import React, { useState, useEffect } from 'react';
import { User, Car, FileText, Gauge, DollarSign, MessageSquare, Camera } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';
import ModalFotos from './ModalFotos';

const HeaderSection = ({ 
  pilotoSeleccionado, 
  setPilotoSeleccionado, 
  vehiculoSeleccionado, 
  setVehiculoSeleccionado,
  hojaSalidaSeleccionada,
  setHojaSalidaSeleccionada,
  kilometraje,
  setKilometraje,
  kilometrajeMinimo,
  setKilometrajeMinimo,
  nivelCombustible,
  setNivelCombustible,
  montoRecaudado,
  setMontoRecaudado,
  observaciones,
  setObservaciones,
  fotosData,
  setFotosData,
  onFotosChange,
  errors = {}
}) => {
  const [pilotos, setPilotos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [hojasSalida, setHojasSalida] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFotosModal, setShowFotosModal] = useState(false);
  const [datosHeredados, setDatosHeredados] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [pilotosRes, vehiculosRes, hojasSalidaRes] = await Promise.all([
        axiosInstance.get('/api/pilotos'),
        axiosInstance.get('/api/vehiculos'),
        axiosInstance.get('/api/hoja-en/hojas-salida-disponibles')
      ]);

      if (pilotosRes.data.success) {
        setPilotos(pilotosRes.data.data);
        // Establecer el piloto autenticado por defecto
        const pilotoAutenticado = pilotosRes.data.data[0]; // Asumiendo que el primero es el autenticado
        if (pilotoAutenticado) {
          setPilotoSeleccionado(pilotoAutenticado.id_piloto.toString());
        }
      }

      if (vehiculosRes.data.success) {
        setVehiculos(vehiculosRes.data.data);
      }

      if (hojasSalidaRes.data.success) {
        setHojasSalida(hojasSalidaRes.data.data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePilotoChange = (e) => {
    setPilotoSeleccionado(e.target.value);
  };

  const handleVehiculoChange = (e) => {
    setVehiculoSeleccionado(e.target.value);
  };

  const handleHojaSalidaChange = async (e) => {
    const hojaId = e.target.value;
    const hojaSeleccionada = hojasSalida.find(h => h.id_hoja.toString() === hojaId);
    setHojaSalidaSeleccionada(hojaSeleccionada || null);
    
    // Cargar kilometraje de la hoja de salida seleccionada
    if (hojaSeleccionada) {
      await loadDatosHojaSalida(hojaSeleccionada.id_hoja);
    } else {
      setKilometrajeMinimo(0);
      setKilometraje('');
      setDatosHeredados(null);
    }
  };

  const loadDatosHojaSalida = async (idHoja) => {
    try {
      const response = await axiosInstance.get(`/api/hoja-en/hoja-salida/${idHoja}/datos`);
      if (response.data.success) {
        const { 
          lectura_km_num, 
          placa_id, 
          id_plataforma, 
          id_piloto, 
          id_vehiculo, 
          piloto_nombre, 
          vehiculo_info 
        } = response.data.data;
        
        // Establecer kilometraje mínimo y actual
        setKilometrajeMinimo(lectura_km_num);
        setKilometraje(lectura_km_num.toString());
        
        // Establecer piloto y vehículo heredados
        setPilotoSeleccionado(id_piloto.toString());
        setVehiculoSeleccionado(id_vehiculo.toString());
        
        // Almacenar datos heredados para mostrar
        setDatosHeredados({
          placa_id,
          id_plataforma,
          piloto_nombre,
          vehiculo_info
        });
        
        console.log('Datos de Hoja de Salida cargados:', {
          lectura_km_num,
          placa_id,
          id_plataforma,
          piloto_nombre,
          vehiculo_info
        });
      }
    } catch (error) {
      console.error('Error loading datos hoja salida:', error);
    }
  };

  const handleOpenFotosModal = () => {
    setShowFotosModal(true);
  };

  const handleSaveFotos = async (fotosArray) => {
    try {
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
      onFotosChange(fotosConBase64);
      
      // Cerrar modal
      setShowFotosModal(false);
      
      // Mostrar mensaje de éxito
      alert('Fotos guardadas en memoria. Se guardarán en BD al finalizar la hoja.');
      
    } catch (error) {
      console.error('Error processing fotos:', error);
      alert('Error al procesar las fotos');
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Hoja de Entrada</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Piloto */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <User className="w-4 h-4 mr-2" />
            Piloto
          </label>
          <select
            value={pilotoSeleccionado}
            onChange={handlePilotoChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.piloto ? 'border-red-500' : 'border-gray-300'
            } ${datosHeredados ? 'bg-gray-100' : ''}`}
            disabled={loading || !!datosHeredados}
          >
            <option value="">Seleccionar piloto</option>
            {pilotos.map((piloto) => (
              <option key={piloto.id_piloto} value={piloto.id_piloto}>
                {piloto.nombres} {piloto.apellidos}
              </option>
            ))}
          </select>
          {datosHeredados && (
            <p className="text-blue-600 text-xs">Heredado de la Hoja de Salida</p>
          )}
          {errors.piloto && (
            <p className="text-red-500 text-xs">{errors.piloto}</p>
          )}
        </div>

        {/* Vehículo */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Car className="w-4 h-4 mr-2" />
            Vehículo
          </label>
          <select
            value={vehiculoSeleccionado}
            onChange={handleVehiculoChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.vehiculo ? 'border-red-500' : 'border-gray-300'
            } ${datosHeredados ? 'bg-gray-100' : ''}`}
            disabled={loading || !!datosHeredados}
          >
            <option value="">Seleccionar vehículo</option>
            {vehiculos.map((vehiculo) => (
              <option key={vehiculo.id_vehiculo} value={vehiculo.id_vehiculo}>
                {vehiculo.placa_id} - {vehiculo.marca} {vehiculo.modelo}
              </option>
            ))}
          </select>
          {datosHeredados && (
            <p className="text-blue-600 text-xs">Heredado de la Hoja de Salida</p>
          )}
          {errors.vehiculo && (
            <p className="text-red-500 text-xs">{errors.vehiculo}</p>
          )}
        </div>

        {/* Hoja de Salida */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <FileText className="w-4 h-4 mr-2" />
            Hoja de Salida
          </label>
          <select
            value={hojaSalidaSeleccionada?.id_hoja || ''}
            onChange={handleHojaSalidaChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.hojaSalida ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value="">Seleccionar hoja de salida</option>
            {hojasSalida.map((hoja) => (
              <option key={hoja.id_hoja} value={hoja.id_hoja}>
                {hoja.display_text}
              </option>
            ))}
          </select>
          {errors.hojaSalida && (
            <p className="text-red-500 text-xs">{errors.hojaSalida}</p>
          )}
        </div>

        {/* Datos Heredados de la Hoja de Salida */}
        {datosHeredados && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-blue-800 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Datos Heredados de la Hoja de Salida
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Piloto:</span>
                <span className="ml-2 text-gray-600">{datosHeredados.piloto_nombre}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Vehículo:</span>
                <span className="ml-2 text-gray-600">{datosHeredados.vehiculo_info}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Placa:</span>
                <span className="ml-2 text-gray-600">{datosHeredados.placa_id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Plataforma:</span>
                <span className="ml-2 text-gray-600">{datosHeredados.id_plataforma}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Kilometraje */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Gauge className="w-4 h-4 mr-2" />
            Kilometraje
          </label>
          <input
            type="number"
            value={kilometraje}
            onChange={(e) => setKilometraje(e.target.value)}
            min={kilometrajeMinimo}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.kilometraje ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ingrese el kilometraje"
          />
          {kilometrajeMinimo > 0 && (
            <p className="text-xs text-gray-500">
              Kilometraje mínimo: {kilometrajeMinimo.toLocaleString()} km
            </p>
          )}
          {errors.kilometraje && (
            <p className="text-red-500 text-xs">{errors.kilometraje}</p>
          )}
        </div>

        {/* Nivel de Combustible */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Gauge className="w-4 h-4 mr-2" />
            Nivel de Combustible
          </label>
          <select
            value={nivelCombustible}
            onChange={(e) => setNivelCombustible(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.nivelCombustible ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value="">Seleccionar nivel</option>
            {Array.from({ length: 11 }, (_, i) => i * 10).map((value) => (
              <option key={value} value={value}>
                {value}%
              </option>
            ))}
          </select>
          {errors.nivelCombustible && (
            <p className="text-red-500 text-xs">{errors.nivelCombustible}</p>
          )}
        </div>

        {/* Monto Recaudado */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            
            Q. Monto Recaudado
          </label>
          <input
            type="number"
            step="0.01"
            value={montoRecaudado}
            onChange={(e) => setMontoRecaudado(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.montoRecaudado ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
            min="0.01"
          />
          {errors.montoRecaudado && (
            <p className="text-red-500 text-xs">{errors.montoRecaudado}</p>
          )}
        </div>
      </div>

      {/* Observaciones */}
      <div className="mt-6 space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <MessageSquare className="w-4 h-4 mr-2" />
          Observaciones
        </label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Ingrese observaciones adicionales..."
        />
      </div>

      {/* Fotos de la Motocicleta */}
      <div className="mt-6 space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Camera className="w-4 h-4 mr-2" />
          Fotos de la Motocicleta
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <button
            onClick={handleOpenFotosModal}
            className="cursor-pointer block w-full"
          >
            <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Haga clic para cargar fotos</p>
            <p className="text-sm text-gray-500">5 fotos requeridas</p>
          </button>
          {fotosData.length > 0 && (
            <p className="text-green-600 text-sm mt-2">
              {fotosData.length} fotos seleccionadas
            </p>
          )}
        </div>
        {errors.fotos && (
          <p className="text-red-500 text-xs">{errors.fotos}</p>
        )}
      </div>

      {/* Modal de Fotos */}
      <ModalFotos
        isOpen={showFotosModal}
        onClose={() => setShowFotosModal(false)}
        onSave={handleSaveFotos}
        idHoja="ENTRADA"
      />
    </div>
  );
};

export default HeaderSection;


