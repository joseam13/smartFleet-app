import React, { useState, useEffect } from 'react';
import { Star, User, Truck, Gauge, FileText, Fuel } from 'lucide-react';
import FuelGauge from './FuelGauge';
import MotorcycleViews from './MotorcycleViews';
import ValesCombustibleList from './ValesCombustibleList';
import axiosInstance from '../../utils/axiosConfig';



const HeaderSection = ({
  clienteSeleccionado,
  setClienteSeleccionado,
  pilotoSeleccionado,
  setPilotoSeleccionado,
  vehiculoSeleccionado,
  setVehiculoSeleccionado,
  kilometraje,
  setKilometraje,
  observaciones,
  setObservaciones,
  pilotos,
  vehiculos,
  kilometrajeActual,
  errors,
  // Nuevos props
  numeroHoja,
  setNumeroHoja,
  porcentajeTanque,
  setPorcentajeTanque,
  // Props para fotos
  fotosCargadas,
  fotosFaltantes,
  onOpenFotosModal,
  // Props para vales de combustible
  valeSeleccionado,
  setValeSeleccionado
}) => {
  // Debug: Verificar props recibidos
  console.log('HeaderSection props:', {
    porcentajeTanque,
    setPorcentajeTanque: typeof setPorcentajeTanque
  });

  // Removido handleImageChange ya que ahora usamos el modal de fotos
  return (
    <div className="bg-gray-800 text-white p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
      
        
        {/* Campo Hoja No. 
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-6x1 font-medium">Hoja No.</span>
            <div className="text-6x1 px-3 py-1 bg-gray-700 rounded-lg min-w-[60px] text-center">
              {numeroHoja || '---'}
            </div>
          </div>
        </div>
        */}
        
        {/* Botones de Cliente */}
        <div className="flex space-x-2">
          <button
            onClick={() => setClienteSeleccionado('YANGO')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              clienteSeleccionado === 'YANGO' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>YANGO</span>
          </button>
          <button
            onClick={() => setClienteSeleccionado('UBER')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              clienteSeleccionado === 'UBER' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>UBER</span>
          </button>
        </div>
      </div>

      {/* Campos del formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Piloto */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            <User className="w-4 h-4 inline mr-2" />
            Piloto
          </label>
          <select
            value={pilotoSeleccionado}
            onChange={(e) => setPilotoSeleccionado(e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.piloto ? 'border-red-500' : 'border-gray-600'
            }`}
          >
            <option value="">Seleccionar piloto</option>
            {pilotos.map((piloto) => (
              <option key={piloto.id_piloto} value={piloto.id_piloto}>
                {piloto.nombres} {piloto.apellidos}
              </option>
            ))}
          </select>
          {errors.piloto && (
            <p className="text-red-400 text-xs">{errors.piloto}</p>
          )}
        </div>

        {/* Vehículo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            <Truck className="w-4 h-4 inline mr-2" />
            Vehículo
          </label>
          <select
            value={vehiculoSeleccionado}
            onChange={(e) => setVehiculoSeleccionado(e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.vehiculo ? 'border-red-500' : 'border-gray-600'
            }`}
          >
            <option value="">Seleccionar vehículo</option>
            {vehiculos.map((vehiculo) => (
              <option key={vehiculo.id_vehiculo} value={vehiculo.id_vehiculo}>
                {vehiculo.placa_id} - {vehiculo.marca_vehiculo} {vehiculo.modelo}
              </option>
            ))}
          </select>
          {errors.vehiculo && (
            <p className="text-red-400 text-xs">{errors.vehiculo}</p>
          )}
        </div>

        {/* Kilometraje */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            <Gauge className="w-4 h-4 inline mr-2" />
            Kilometraje
          </label>
          <input
            type="number"
            value={kilometraje}
            onChange={(e) => setKilometraje(e.target.value)}
            placeholder={kilometrajeActual ? kilometrajeActual.toString() : "10000"}
            min={kilometrajeActual || 0}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.kilometraje ? 'border-red-500' : 'border-gray-600'
            }`}
          />
          {kilometrajeActual > 0 && (
            <p className="text-xs text-gray-400">
              Kilometraje actual: {kilometrajeActual}
            </p>
          )}
          {
            <p className="text-xs text-gray-400">15 Dias para el proximo servicio</p>
          }
          {errors.kilometraje && (
            <p className="text-red-400 text-xs">{errors.kilometraje}</p>
          )}
        </div>

        {/* Observaciones */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            <FileText className="w-4 h-4 inline mr-2" />
            Observaciones
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Observaciones"
            rows={3}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Segunda fila de campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Gauge de Combustible */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            <Fuel className="w-4 h-4 inline mr-2" />
            Nivel de Combustible
          </label>
          <div className="bg-gray-700 p-4 rounded-lg">
            <FuelGauge
              percentage={porcentajeTanque}
              onPercentageChange={setPorcentajeTanque}
            />
          </div>
          {errors.porcentajeTanque && (
            <p className="text-red-400 text-xs">{errors.porcentajeTanque}</p>
          )}
        </div>

        {/* Fotos de la Motocicleta */}
        <div className="space-y-2">
          <div className="bg-gray-700 p-4 rounded-lg">
            <MotorcycleViews
              onOpenModal={onOpenFotosModal}
              fotosCargadas={fotosCargadas}
              fotosFaltantes={fotosFaltantes}
            />
          </div>
          {errors.fotos && (
            <p className="text-red-400 text-xs">{errors.fotos}</p>
          )}
        </div>
      </div>

      {/* Tercera fila - Vales de Combustible */}
      <div className="mt-6">
        <ValesCombustibleList
          valeSeleccionado={valeSeleccionado}
          setValeSeleccionado={setValeSeleccionado}
          errors={errors}
        />
      </div>
    </div>
  );
};

export default HeaderSection;
