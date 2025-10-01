import React, { useState, useRef } from 'react';
import { Camera, X, Check, AlertCircle } from 'lucide-react';

const ModalFotos = ({ isOpen, onClose, onSave, idHoja }) => {
  const [fotos, setFotos] = useState({
    lateral_derecha: null,
    lateral_izquierda: null,
    frontal: null,
    trasero: null,
    odometro: null
  });
  
  const [previews, setPreviews] = useState({
    lateral_derecha: null,
    lateral_izquierda: null,
    frontal: null,
    trasero: null,
    odometro: null
  });

  const fileInputRefs = {
    lateral_derecha: useRef(null),
    lateral_izquierda: useRef(null),
    frontal: useRef(null),
    trasero: useRef(null),
    odometro: useRef(null)
  };

  const tiposFotos = [
    { key: 'lateral_derecha', label: 'Vista Lateral Derecha', icon: '🏍️' },
    { key: 'lateral_izquierda', label: 'Vista Lateral Izquierda', icon: '🏍️' },
    { key: 'frontal', label: 'Vista Frontal', icon: '🏍️' },
    { key: 'trasero', label: 'Vista Trasera', icon: '🏍️' },
    { key: 'odometro', label: 'Foto del Odómetro', icon: '📊' }
  ];

  const handleFileSelect = (tipo, event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        alert('Por favor seleccione un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB permitido');
        return;
      }

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFotos(prev => ({
          ...prev,
          [tipo]: {
            file,
            nombre_archivo: file.name,
            tamano_archivo: file.size,
            tipo_mime: file.type
          }
        }));
        setPreviews(prev => ({
          ...prev,
          [tipo]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFoto = (tipo) => {
    setFotos(prev => ({
      ...prev,
      [tipo]: null
    }));
    setPreviews(prev => ({
      ...prev,
      [tipo]: null
    }));
    if (fileInputRefs[tipo].current) {
      fileInputRefs[tipo].current.value = '';
    }
  };

  const handleClick = (tipo) => {
    if (fileInputRefs[tipo].current) {
      fileInputRefs[tipo].current.click();
    }
  };

  const handleSave = () => {
    const fotosArray = Object.entries(fotos).map(([tipo, foto]) => ({
      tipo_foto: tipo,
      foto: foto ? foto.file : null,
      nombre_archivo: foto ? foto.nombre_archivo : '',
      tamano_archivo: foto ? foto.tamano_archivo : 0,
      tipo_mime: foto ? foto.tipo_mime : 'image/jpeg'
    }));

    // Verificar que todas las fotos estén cargadas
    const fotosFaltantes = fotosArray.filter(foto => !foto.foto);
    if (fotosFaltantes.length > 0) {
      alert(`Faltan ${fotosFaltantes.length} fotos por cargar. Todas las fotos son requeridas.`);
      return;
    }

    onSave(fotosArray);
    // El modal se cerrará automáticamente desde el componente padre
  };

  const fotosCargadas = Object.values(fotos).filter(foto => foto !== null).length;
  const fotosFaltantes = 5 - fotosCargadas;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cargar Fotos de la Motocicleta</h2>
            <p className="text-gray-600 mt-1">Hoja de Entrada</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Estado de fotos */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {fotosCargadas === 5 ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <span className={`font-medium ${fotosCargadas === 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {fotosCargadas === 5 ? 'Fotos completas' : `Faltan ${fotosFaltantes} fotos`}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {fotosCargadas}/5 fotos cargadas
              </div>
            </div>
          </div>

          {/* Grid de fotos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiposFotos.map((tipo) => (
              <div key={tipo.key} className="space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                  <span className="text-2xl">{tipo.icon}</span>
                  <span>{tipo.label}</span>
                </h3>
                
                <div
                  onClick={() => handleClick(tipo.key)}
                  className={`relative w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    fotos[tipo.key]
                      ? 'border-green-300 bg-green-50 hover:bg-green-100'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    ref={fileInputRefs[tipo.key]}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(tipo.key, e)}
                    className="hidden"
                  />
                  
                  {previews[tipo.key] ? (
                    <div className="relative w-full h-full">
                      <img
                        src={previews[tipo.key]}
                        alt={tipo.label}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClick(tipo.key);
                            }}
                            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                            title="Cambiar foto"
                          >
                            <Camera className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFoto(tipo.key);
                            }}
                            className="p-2 bg-white rounded-full shadow-lg hover:bg-red-100"
                            title="Eliminar foto"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Haga clic para subir</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF (máx. 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={fotosCargadas !== 5}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aceptar ({fotosCargadas}/5)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalFotos;
