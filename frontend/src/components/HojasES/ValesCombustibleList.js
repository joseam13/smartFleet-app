import React, { useState, useEffect } from 'react';
import { Fuel, RefreshCw, CheckCircle } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';

const ValesCombustibleList = ({ 
  valeSeleccionado, 
  setValeSeleccionado, 
  errors = {} 
}) => {
  const [vales, setVales] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar vales de combustible activos
  const loadVales = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/vales-combustible');
      if (response.data.success) {
        // Filtrar solo vales con estado ACT
        const valesActivos = response.data.data.filter(vale => vale.estado === 'ACT');
        setVales(valesActivos);
      } else {
        setVales([]);
      }
    } catch (error) {
      console.error('Error cargando vales de combustible:', error);
      setVales([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar vales al montar el componente
  useEffect(() => {
    loadVales();
  }, []);

  // Formatear el texto del vale según la especificación
  const formatValeText = (vale) => {
    return `Q. ${parseFloat(vale.valor_vale).toFixed(2)} - ${vale.cupon}${vale.codigo}`;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        <Fuel className="w-4 h-4 inline mr-2" />
        Vales de Combustible
      </label>
      
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-300">
            {loading ? 'Cargando vales...' : `${vales.length} vales disponibles`}
          </span>
          <button
            onClick={loadVales}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
            <span className="ml-2 text-gray-300">Cargando vales...</span>
          </div>
        ) : vales.length === 0 ? (
          <div className="text-center py-4">
            <Fuel className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No hay vales de combustible disponibles</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {vales.map((vale) => (
              <div
                key={vale.id_vale}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  valeSeleccionado === vale.id_vale
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-600 border-gray-500 text-gray-200 hover:bg-gray-500'
                }`}
                onClick={() => setValeSeleccionado(vale.id_vale)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {formatValeText(vale)}
                      </span>
                      {valeSeleccionado === vale.id_vale && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {vale.proveedor} - {vale.tipo_combustible}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {valeSeleccionado && (
          <div className="mt-3 p-2 bg-green-900 bg-opacity-30 border border-green-500 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300">
                Vale seleccionado: {formatValeText(vales.find(v => v.id_vale === valeSeleccionado))}
              </span>
            </div>
          </div>
        )}
      </div>

      {errors.valeSeleccionado && (
        <p className="text-red-400 text-xs">{errors.valeSeleccionado}</p>
      )}
    </div>
  );
};

export default ValesCombustibleList;
