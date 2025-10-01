import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, X, Camera, Image } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig';

const ItemsRevisadosSection = ({ 
  hojaSalidaSeleccionada,
  itemsRevisados, 
  setItemsRevisados,
  onItemToggle,
  fotosItemsPendientes,
  setFotosItemsPendientes,
  errors = {}
}) => {
  const [itemsSalida, setItemsSalida] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ id_check: '', anotacion: '' });
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [selectedItemForFoto, setSelectedItemForFoto] = useState(null);

  useEffect(() => {
    if (hojaSalidaSeleccionada) {
      loadItemsSalida();
      loadItems();
      // Cargar automáticamente los items de la hoja de salida en itemsRevisados
      loadItemsSalidaToRevisados();
    }
  }, [hojaSalidaSeleccionada]);

  const loadItemsSalida = async () => {
    if (!hojaSalidaSeleccionada) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/hoja-en/items-revisados/${hojaSalidaSeleccionada.id_hoja}`);
      if (response.data.success) {
        setItemsSalida(response.data.data);
      }
    } catch (error) {
      console.error('Error loading items de salida:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const response = await axiosInstance.get('/api/hoja-en/items');
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const loadItemsSalidaToRevisados = async () => {
    if (!hojaSalidaSeleccionada) return;
    
    try {
      console.log('Cargando items para hoja de salida:', hojaSalidaSeleccionada.id_hoja);
      const response = await axiosInstance.get(`/api/hoja-en/items-revisados/${hojaSalidaSeleccionada.id_hoja}`);
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data.success) {
        // Convertir los items de salida al formato de items revisados
        const itemsRevisadosFromSalida = response.data.data.map(item => ({
          id_check: item.id_check,
          desc_check: item.desc_check,
          cod_abreviado: item.cod_abreviado || '',
          anotacion: item.anotacion || '',
          from_salida: true, // Marcar que viene de la hoja de salida
          tiene_foto: false // Inicialmente sin foto
        }));
        
        console.log('Items convertidos:', itemsRevisadosFromSalida);
        
        // Agregar a los items revisados existentes
        setItemsRevisados(prev => {
          // Filtrar items que ya no están en la nueva selección
          const filteredPrev = prev.filter(item => !item.from_salida);
          // Agregar los nuevos items de salida
          return [...filteredPrev, ...itemsRevisadosFromSalida];
        });
      }
    } catch (error) {
      console.error('Error loading items de salida to revisados:', error);
    }
  };

  const handleAddItem = () => {
    if (!newItem.id_check) {
      alert('Seleccione un item');
      return;
    }

    const item = items.find(i => i.id_check.toString() === newItem.id_check);
    if (!item) return;

    const itemRevisado = {
      id_check: item.id_check,
      desc_check: item.desc_check,
      cod_abreviado: item.cod_abreviado || '',
      anotacion: newItem.anotacion
    };

    setItemsRevisados([...itemsRevisados, itemRevisado]);
    setNewItem({ id_check: '', anotacion: '' });
    setShowAddItem(false);

    if (onItemToggle) {
      onItemToggle(item, true);
    }
  };

  const handleRemoveItem = (idCheck) => {
    setItemsRevisados(itemsRevisados.filter(ir => ir.id_check !== idCheck));
    
    const item = items.find(i => i.id_check === idCheck);
    if (item && onItemToggle) {
      onItemToggle(item, false);
    }
  };

  const handleAnotacionChange = (idCheck, anotacion) => {
    setItemsRevisados(itemsRevisados.map(item => 
      item.id_check === idCheck 
        ? { ...item, anotacion }
        : item
    ));
  };

  const handleFotoItem = (item) => {
    setSelectedItemForFoto(item);
    setShowFotoModal(true);
  };

  const handleSaveFotoItem = async (fotoData) => {
    try {
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
      
      // Cerrar modal
      setShowFotoModal(false);
      setSelectedItemForFoto(null);
      
      // Mostrar mensaje de éxito
      alert('Foto del item guardada en memoria. Se guardará en BD al finalizar la hoja.');
      
    } catch (error) {
      console.error('Error processing foto item:', error);
      alert('Error al procesar la foto del item');
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Items Revisados</h2>
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
      <div className="bg-green-300 text-gray-800 px-4 py-3 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Items Revisados</h3>
          <button
            onClick={() => setShowAddItem(!showAddItem)}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de Items */}
      <div className="p-4">

      {errors.itemsRevisados && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{errors.itemsRevisados}</p>
        </div>
      )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="ml-2 text-gray-600">Cargando items...</span>
          </div>
        ) : itemsRevisados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No hay items revisados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {itemsRevisados.map((item, index) => (
              <div
                key={item.id_check}
                className={`p-3 border rounded-lg transition-colors ${
                  item.anotacion || item.tiene_foto
                    ? 'bg-yellow-200 border-yellow-300' 
                    : 'bg-pink-50 border-pink-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      A
                    </div>
                    <div>
                      <span className="text-gray-800 font-medium flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span>{item.desc_check || `Item ${item.id_check}`}</span>
                          {item.tiene_foto && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-blue-600 font-medium">📷</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-900">
                          <span className="font-medium">Código:</span> 
                          <span className="text-xs text-gray-500 ml-1">{item.cod_abreviado || 'N/A'}</span>
                        </div>
                      </span>
                      {item.anotacion && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.anotacion}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!item.from_salida && (
                      <button
                        onClick={() => handleRemoveItem(item.id_check)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1 text-sm font-medium"
                      >
                        <X className="w-4 h-4" />
                        <span>Quitar</span>
                      </button>
                    )}
                    
                    {!item.from_salida && (
                      <button
                        onClick={() => {
                          const newAnotacion = prompt('Ingrese anotación:', item.anotacion || '');
                          if (newAnotacion !== null) {
                            handleAnotacionChange(item.id_check, newAnotacion);
                          }
                        }}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1 text-sm font-medium"
                      >
                        <span>Notas</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleFotoItem(item)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm font-medium"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Foto</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para agregar nuevo item */}
        {showAddItem && (
          <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-800 mb-3">Agregar Nuevo Item</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item
                </label>
                <select
                  value={newItem.id_check}
                  onChange={(e) => setNewItem({ ...newItem, id_check: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar item</option>
                  {items
                    .filter(item => !itemsRevisados.some(ir => ir.id_check === item.id_check))
                    .map((item) => (
                      <option key={item.id_check} value={item.id_check}>
                        {item.desc_check}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anotaciones
                </label>
                <textarea
                  value={newItem.anotacion}
                  onChange={(e) => setNewItem({ ...newItem, anotacion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Ingrese observaciones..."
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Agregar
                </button>
                <button
                  onClick={() => {
                    setShowAddItem(false);
                    setNewItem({ id_check: '', anotacion: '' });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para subir foto de item */}
      {showFotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Subir Foto - {selectedItemForFoto?.desc_check}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const fotoData = {
                        file: file,
                        nombre_archivo: file.name,
                        tamano_archivo: file.size,
                        tipo_mime: file.type
                      };
                      handleSaveFotoItem(fotoData);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowFotoModal(false);
                    setSelectedItemForFoto(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsRevisadosSection;


