# Implementación de Fotos en Memoria - Items Individuales

## Problema Identificado

**Antes**: Las fotos de items se intentaban guardar en la BD inmediatamente, pero el `id_hoja` no existe hasta que se da clic en "Listo" al final de la Hoja de Salida.

**Solución**: Almacenar las fotos en memoria hasta que se genere el `id_hoja`, luego guardarlas en la BD.

## Cambios Implementados

### 1. **Nuevo Estado en Memoria**
```javascript
// Estados para fotos de items en memoria
const [fotosItemsPendientes, setFotosItemsPendientes] = useState([]);
```

### 2. **Flujo Modificado - Guardar en Memoria**
```javascript
const handleSaveFotoItem = async (fotoData) => {
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

  // Actualizar estado visual inmediatamente
  setItemsRevisados(prev => 
    prev.map(item => 
      item.id_check === selectedItemForFoto.id_check 
        ? { ...item, tiene_foto: true }
        : item
    )
  );
};
```

### 3. **Flujo Final - Guardar en BD**
```javascript
const handleListo = async () => {
  // ... crear hoja y obtener id_hoja ...

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
};
```

## Flujo Completo

### **Fase 1: Durante la Edición**
1. **Usuario selecciona item** → Se mueve a "Check Done"
2. **Usuario hace clic en "Foto"** → Modal se abre
3. **Usuario selecciona imagen** → Vista previa
4. **Usuario da "Listo"** → 
   - ✅ **Foto se guarda en memoria** (`fotosItemsPendientes`)
   - ✅ **Estado visual se actualiza** (item amarillo + ícono)
   - ✅ **Modal se cierra**
   - ❌ **NO se guarda en BD** (no hay `id_hoja`)

### **Fase 2: Al Finalizar la Hoja**
1. **Usuario da "Listo" al final** → 
   - ✅ **Se genera `id_hoja`**
   - ✅ **Se crea la hoja en BD**
   - ✅ **Se guardan items revisados**
   - ✅ **Se guardan fotos de items en BD** (con `id_hoja` válido)
   - ✅ **Se resetea todo**

## Ventajas del Sistema

### **1. Consistencia de Datos**
- ✅ No se intenta guardar sin `id_hoja`
- ✅ Todas las fotos se guardan con el `id_hoja` correcto
- ✅ No hay referencias huérfanas en la BD

### **2. Experiencia de Usuario**
- ✅ **Feedback visual inmediato** - Item se pone amarillo al instante
- ✅ **No hay errores** - No se intenta guardar sin `id_hoja`
- ✅ **Flujo natural** - Modal se cierra correctamente
- ✅ **Persistencia visual** - El estado se mantiene durante la sesión

### **3. Manejo de Errores**
- ✅ **Errores individuales** - Si una foto falla, las otras se guardan
- ✅ **Logging detallado** - Se registra qué foto falló
- ✅ **No interrumpe el flujo** - La hoja se crea aunque fallen algunas fotos

## Estructura de Datos en Memoria

```javascript
fotosItemsPendientes = [
  {
    id_check: 123,
    foto: "base64_string",
    nombre_archivo: "foto.jpg",
    tamano_archivo: 1024000,
    tipo_mime: "image/jpeg",
    desc_check: "Espejos"
  },
  // ... más fotos
]
```

## Estados del Sistema

| Momento | Fotos en Memoria | Fotos en BD | Estado Visual |
|---------|------------------|-------------|---------------|
| **Durante edición** | ✅ Almacenadas | ❌ No guardadas | ✅ Amarillo + ícono |
| **Después de "Listo"** | ✅ Almacenadas | ✅ Guardadas | ✅ Amarillo + ícono |
| **Después de reset** | ❌ Limpiadas | ✅ Guardadas | ❌ Rosa claro |

## Limpieza de Memoria

### **Al Finalizar Exitosamente:**
```javascript
setFotosItemsPendientes([]); // Limpiar memoria
```

### **Al Cancelar:**
```javascript
setFotosItemsPendientes([]); // Limpiar memoria
```

## Consideraciones Técnicas

### **1. Memoria**
- Las fotos se almacenan como base64 en memoria
- Se limpian automáticamente al finalizar o cancelar
- No hay acumulación de memoria durante la sesión

### **2. Rendimiento**
- Conversión a base64 solo una vez (al seleccionar)
- No hay llamadas innecesarias a la BD
- Guardado en lote al final

### **3. Robustez**
- Manejo de errores individual por foto
- No se interrumpe el flujo principal
- Logging detallado para debugging

---

**Estado**: ✅ **COMPLETADO** - Sistema de fotos en memoria implementado exitosamente.




