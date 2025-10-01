import React, { useState, useEffect } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';

const ChecklistSection = ({ 
  itemsRevisados, 
  setItemsRevisados, 
  onItemToggle,
  errors = {}
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/hoja-en/items');
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (item) => {
    const isChecked = itemsRevisados.some(ir => ir.id_check === item.id_check);
    
    if (isChecked) {
      // Remover item
      setItemsRevisados(itemsRevisados.filter(ir => ir.id_check !== item.id_check));
    } else {
      // Agregar item
      const newItem = {
        id_check: item.id_check,
        desc_check: item.desc_check,
        anotacion: ''
      };
      setItemsRevisados([...itemsRevisados, newItem]);
    }
    
    if (onItemToggle) {
      onItemToggle(item, !isChecked);
    }
  };

  const handleAnotacionChange = (idCheck, anotacion) => {
    setItemsRevisados(itemsRevisados.map(item => 
      item.id_check === idCheck 
        ? { ...item, anotacion }
        : item
    ));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Checklist</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="bg-gray-600 text-white px-4 py-3 rounded-t-lg">
        <h3 className="text-lg font-semibold">Items a Validar</h3>
      </div>

      {/* Lista de Items */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando items...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay items pendientes de validar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items
              .filter(item => !itemsRevisados.some(ir => ir.id_check === item.id_check))
              .map((item) => (
              <div
                key={item.id_check}
                className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    A
                  </div>
                  <span className="text-gray-800 font-medium flex flex-col">
                    {item.desc_check || `Item ${item.id_check}`}
                    <div className="text-xs text-slate-900">Abrev: <span className="text-xs text-gray-500">{item.cod_abreviado || 'N/A'}</span>
                    </div>
                  </span>
                </div>
                
                <button
                  onClick={() => handleItemToggle(item)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm font-medium"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Validar</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistSection;


