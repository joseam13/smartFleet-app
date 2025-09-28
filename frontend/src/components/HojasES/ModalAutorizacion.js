import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Fuel, XCircle } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';

const ModalAutorizacion = ({ isOpen, onClose, onSuccess, hoja }) => {
  const [loading, setLoading] = useState(false);
  const [valeAsociado, setValeAsociado] = useState(null);
  const [observaciones, setObservaciones] = useState('');

  // Cargar vale asociado al abrir el modal
  useEffect(() => {
    if (isOpen && hoja) {
      loadValeAsociado();
      setObservaciones(hoja.observaciones || '');
    }
  }, [isOpen, hoja]);

  const loadValeAsociado = async () => {
    try {
      const response = await axiosInstance.get(`/api/hoja-es/vale-por-hoja/${hoja.id_hoja}`);
      if (response.data.success) {
        setValeAsociado(response.data.data);
      } else {
        setValeAsociado(null);
      }
    } catch (error) {
      console.error('Error loading vale asociado:', error);
      setValeAsociado(null);
    }
  };

  const handleAutorizar = async () => {
    if (!valeAsociado) {
      alert('No se encontró un vale de combustible asociado a esta hoja de salida');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/api/hoja-es/autorizacion/autorizar', {
        id_hoja: hoja.id_hoja
      });

      alert('Hoja de salida autorizada exitosamente');
      onSuccess();
    } catch (error) {
      console.error('Error authorizing hoja:', error);
      alert('Error al autorizar la hoja de salida');
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    const confirmRechazar = window.confirm(
      `¿Está seguro que desea rechazar la Hoja de Salida #${hoja.id_hoja}?\n\nEsta acción cancelará la hoja y no se podrá deshacer.`
    );

    if (!confirmRechazar) return;

    setLoading(true);
    try {
      await axiosInstance.post('/api/hoja-es/autorizacion/rechazar', {
        id_hoja: hoja.id_hoja,
        observaciones: observaciones
      });

      alert('Hoja de salida rechazada exitosamente');
      onSuccess();
    } catch (error) {
      console.error('Error rechazando hoja:', error);
      alert('Error al rechazar la hoja de salida');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setValeAsociado(null);
    setObservaciones('');
    onClose();
  };

  if (!isOpen || !hoja) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Autorizar Hoja de Salida</h2>
            <p className="text-gray-600 mt-1">Hoja No. {hoja.id_hoja}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Información de la Hoja */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* ID Hoja */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Hoja
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900">
                {hoja.id_hoja}
              </div>
            </div>

            {/* Plataforma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plataforma
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900">
                {hoja.id_plataforma}
              </div>
            </div>

            {/* Piloto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Piloto
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900">
                {hoja.nombres} {hoja.apellidos}
              </div>
            </div>

            {/* Placa Moto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placa Moto
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900">
                {hoja.placa_vehiculo}
              </div>
            </div>

            {/* Lectura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lectura (Km)
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900">
                {hoja.lectura_km_num?.toLocaleString() || 'N/A'}
              </div>
            </div>

            {/* Vale de Combustible Asociado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vale de Combustible Asociado
              </label>
              {valeAsociado ? (
                <div className="px-3 py-2 bg-green-50 border border-green-300 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Fuel className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 font-medium">
                      Q. {parseFloat(valeAsociado.valor_vale).toFixed(2)} - {valeAsociado.cupon}{valeAsociado.codigo}
                    </span>
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    {valeAsociado.proveedor} - {valeAsociado.tipo_combustible}
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 bg-red-50 border border-red-300 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-800">
                      No se encontró un vale de combustible asociado
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Items con observaciones */}
          {hoja.items_con_observaciones && hoja.items_con_observaciones.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items con Observaciones
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="space-y-2">
                  {hoja.items_con_observaciones.map((item, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-gray-900">{item.desc_check}:</span>
                      <span className="text-gray-700 ml-2">{item.anotacion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleRechazar}
            disabled={loading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Rechazar</span>
              </>
            )}
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleAutorizar}
              disabled={!valeAsociado || loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Autorizando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Autorizar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAutorizacion;
