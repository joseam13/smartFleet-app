const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../../../config/database');
const { auth } = require('../../../middleware/auth');

const router = express.Router();

// GET - Obtener items de checklist (FLVEH_M007)
router.get('/items', auth, async (req, res) => {
  try {
    const [items] = await pool.execute(
      'SELECT id_check, desc_check, cod_abreviado, estado FROM FLVEHI.FLVEH_M007 WHERE estado = "ACT" ORDER BY id_check ASC'
    );
    
    console.log('Items obtenidos de FLVEH_M007:', items);
    
    res.json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (error) {
    console.error('Error getting checklist items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener los items del checklist' 
    });
  }
});

// GET - Obtener pilotos disponibles (FLVEH_M004)
router.get('/pilotos', auth, async (req, res) => {
  try {
    const [pilotos] = await pool.execute(
      'SELECT id_piloto, nombres, apellidos FROM FLVEHI.FLVEH_M004 WHERE estado = "ACT" ORDER BY nombres ASC'
    );
    
    res.json({
      success: true,
      data: pilotos,
      total: pilotos.length
    });
  } catch (error) {
    console.error('Error getting pilotos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener los pilotos' 
    });
  }
});

// GET - Obtener vehículos disponibles (FLVEH_M001)
router.get('/vehiculos', auth, async (req, res) => {
  try {
    const [vehiculos] = await pool.execute(
      'SELECT id_vehiculo, placa_id, marca_vehiculo, modelo, kilometraje FROM FLVEHI.FLVEH_M001 WHERE estado = "ACT" ORDER BY placa_id ASC'
    );
    
    res.json({
      success: true,
      data: vehiculos,
      total: vehiculos.length
    });
  } catch (error) {
    console.error('Error getting vehiculos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener los vehículos' 
    });
  }
});

// GET - Obtener kilometraje de un vehículo específico
router.get('/vehiculo/:id/kilometraje', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [vehiculo] = await pool.execute(
      'SELECT kilometraje FROM FLVEHI.FLVEH_M001 WHERE id_vehiculo = ? AND estado = "ACT"',
      [id]
    );
    
    if (vehiculo.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Vehículo no encontrado' 
      });
    }
    
    res.json({
      success: true,
      data: { kilometraje: vehiculo[0].kilometraje }
    });
  } catch (error) {
    console.error('Error getting vehiculo kilometraje:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener el kilometraje del vehículo' 
    });
  }
});

// POST - Crear nueva hoja de salida (FLVEH_T001)
router.post('/hoja', auth, [
  body('id_plataforma').notEmpty().isIn(['UBER', 'YANGO']),
  body('id_piloto').notEmpty().isInt({ min: 1 }),
  body('id_vehiculo').notEmpty().isInt({ min: 1 }),
  body('placa_id').notEmpty().trim().escape(),
  body('lectura_km_num').notEmpty().isInt({ min: 0 }),
  body('observaciones').optional().trim().escape(),
  body('porcentaje_tanque').optional().isFloat({ min: 0, max: 100 }),
  body('lectura_km_pic').optional().trim(),
  body('id_vale').optional().custom((value) => {
    if (value === null || value === undefined || value === '') {
      return true; // Permitir valores nulos/vacíos
    }
    if (typeof value === 'number' && value >= 1) {
      return true; // Permitir enteros >= 1
    }
    throw new Error('id_vale debe ser un entero mayor o igual a 1');
  })
], async (req, res) => {
  try {
    console.log('📊 Datos recibidos en backend:', req.body);
    
    // Validar campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      id_plataforma,
      id_piloto,
      id_vehiculo,
      placa_id,
      lectura_km_num,
      observaciones,
      porcentaje_tanque,
      lectura_km_pic,
      id_vale
    } = req.body;

    // Obtener el siguiente ID de hoja usando el procedimiento almacenado
    await pool.execute('CALL sql_get_seq_num(1, "HOJASA", @v_seqnum)');
    const [result] = await pool.execute('SELECT @v_seqnum as siguiente_numero');
    const id_hoja = result[0].siguiente_numero;

    // Insertar en FLVEH_T001 (maestro)
    const [insertResult] = await pool.execute(
      `INSERT INTO FLVEHI.FLVEH_T001 (
        id_hoja, id_empresa, id_plataforma, id_piloto, id_vehiculo, placa_id, 
        lectura_km_pic, lectura_km_txt, tipo_hoja, id_hoja_referencia, 
        lectura_km_num, id_vale, porcentaje_tanque, id_usuario, observaciones, 
        fe_registro, fe_modificacion, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
      [
        id_hoja, 1, id_plataforma, id_piloto, id_vehiculo, placa_id,
        lectura_km_pic || '', 0, 'S', 0, lectura_km_num,
        id_vale || null, porcentaje_tanque || null,
        req.user.id_usuario, observaciones || '', 'ING'
      ]
    );

    // Si se proporcionó un vale, actualizar su estado a 'RES' (Reservado)
    if (id_vale) {
      console.log(`📝 Actualizando vale ${id_vale} a estado RES para hoja ${id_hoja}`);
      await pool.execute(
        'UPDATE FLVEHI.FLVEH_M010 SET estado = "RES", id_hoja_salida = ?, fe_modificacion = CURRENT_TIMESTAMP WHERE id_vale = ?',
        [id_hoja, id_vale]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Hoja de salida creada exitosamente',
      data: { id_hoja }
    });

  } catch (error) {
    console.error('Error creating hoja:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al crear la hoja de salida' 
    });
  }
});

// POST - Agregar item revisado (FLVEH_T002)
router.post('/item-revisado', auth, [
  body('id_hoja').notEmpty().isInt({ min: 1 }),
  body('id_check').notEmpty().isInt({ min: 1 }),
  body('anotacion').optional().trim().escape()
], async (req, res) => {
  try {
    // Validar campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id_hoja, id_check, anotacion } = req.body;

    // Insertar en FLVEH_T002 (detalle)
    await pool.execute(
      `INSERT INTO FLVEHI.FLVEH_T002 (
        id_hoja, id_empresa, id_check, anotacion, id_usuario, 
        tiempo_inicio, tiempo_final, tipo_hoja, fe_registro, fe_modificacion, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
      [
        id_hoja, 1, id_check, anotacion || '', req.user.id_usuario,
        '', '', 'S', 'ING'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Item revisado agregado exitosamente'
    });

  } catch (error) {
    console.error('Error adding item revisado:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al agregar el item revisado' 
    });
  }
});

// GET - Obtener hojas de salida existentes
router.get('/hojas', auth, async (req, res) => {
  try {
    const [hojas] = await pool.execute(
      `SELECT h.*, p.nombres, p.apellidos, v.placa_id, v.marca_vehiculo, v.modelo
       FROM FLVEHI.FLVEH_T001 h
       LEFT JOIN FLVEHI.FLVEH_M004 p ON h.id_piloto = p.id_piloto
       LEFT JOIN FLVEHI.FLVEH_M001 v ON h.id_vehiculo = v.id_vehiculo
       WHERE h.estado = "ACT"
       ORDER BY h.fe_registro DESC`
    );
    
    res.json({
      success: true,
      data: hojas,
      total: hojas.length
    });
  } catch (error) {
    console.error('Error getting hojas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener las hojas de salida' 
    });
  }
});

// GET - Obtener items revisados de una hoja específica
router.get('/hoja/:id/items', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [items] = await pool.execute(
      `SELECT i.*, c.desc_check
       FROM FLVEHI.FLVEH_T002 i
       LEFT JOIN FLVEHI.FLVEH_M007 c ON i.id_check = c.id_check
       WHERE i.id_hoja = ? AND i.estado = "ING"
       ORDER BY i.fe_registro ASC`,
      [id]
    );
    
    res.json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (error) {
    console.error('Error getting hoja items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener los items de la hoja' 
    });
  }
});

// GET - Obtener vales de combustible disponibles (FLVEH_M010)
router.get('/vales-combustible', auth, async (req, res) => {
  try {
    // Primero intentar con estado ACT, si no hay resultados, mostrar todos los vales disponibles
    let [vales] = await pool.execute(
      `SELECT id_vale, valor_vale, cupon, codigo, estado 
       FROM FLVEHI.FLVEH_M010 
       WHERE estado = "ACT" 
       ORDER BY valor_vale ASC`
    );
    
    // Si no hay vales con estado ACT, mostrar todos los vales disponibles
    if (vales.length === 0) {
      [vales] = await pool.execute(
        `SELECT id_vale, valor_vale, cupon, codigo, estado 
         FROM FLVEHI.FLVEH_M010 
         WHERE estado IN ("ING", "DISP", "ACT") 
         ORDER BY valor_vale ASC`
      );
    }
    
    // Formatear los datos según el requerimiento
    const valesFormateados = vales.map(vale => ({
      vale_id: vale.id_vale,
      display_text: `Q. ${vale.valor_vale} - ${vale.cupon}${vale.codigo}`,
      valor_vale: vale.valor_vale,
      cupon: vale.cupon,
      codigo: vale.codigo,
      estado: vale.estado
    }));
    
    res.json({
      success: true,
      data: valesFormateados,
      total: valesFormateados.length
    });
  } catch (error) {
    console.error('Error getting vales combustible:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener los vales de combustible' 
    });
  }
});

// GET - Obtener vale de combustible asociado a una hoja de salida
router.get('/vale-por-hoja/:id_hoja', auth, async (req, res) => {
  try {
    const { id_hoja } = req.params;
    
    const [vales] = await pool.execute(
      `SELECT 
        id_vale, id_empresa, id_sede_origen, id_hoja_salida, tipo_combustible, 
        proveedor, fe_emision, fe_validez, cod_barra, cupon, codigo, 
        valor_vale, id_autoriza, observaciones, fe_registro, fe_modificacion, estado
      FROM FLVEHI.FLVEH_M010 
      WHERE id_hoja_salida = ? AND estado = 'RES'
      ORDER BY fe_registro DESC
      LIMIT 1`,
      [id_hoja]
    );

    if (vales.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró un vale de combustible asociado a esta hoja de salida'
      });
    }

    res.json({
      success: true,
      data: vales[0]
    });
  } catch (error) {
    console.error('Error getting vale by hoja:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener el vale de combustible' 
    });
  }
});

// GET - Obtener detalle de una hoja específica
router.get('/hoja/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [hojas] = await pool.execute(
      `SELECT h.*, p.nombres, p.apellidos, v.placa_id, v.marca_vehiculo, v.modelo
       FROM FLVEHI.FLVEH_T001 h
       LEFT JOIN FLVEHI.FLVEH_M004 p ON h.id_piloto = p.id_piloto
       LEFT JOIN FLVEHI.FLVEH_M001 v ON h.id_vehiculo = v.id_vehiculo
       WHERE h.id_hoja = ?`,
      [id]
    );
    
    if (hojas.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hoja de salida no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: hojas[0]
    });
  } catch (error) {
    console.error('Error getting hoja detail:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener el detalle de la hoja' 
    });
  }
});

// GET - Obtener siguiente número de hoja usando sql_get_seq_num
router.get('/siguiente-hoja', auth, async (req, res) => {
  try {
    // Ejecutar el procedimiento almacenado para obtener el siguiente número
    await pool.execute('CALL sql_get_seq_num(1, "HOJASA", @v_seqnum)');
    
    // Obtener el valor de la variable
    const [result] = await pool.execute('SELECT @v_seqnum as siguiente_numero');
    
    const siguienteNumero = result[0].siguiente_numero;
    
    res.json({
      success: true,
      data: { 
        id_hoja: siguienteNumero,
        numero_hoja: siguienteNumero
      }
    });
  } catch (error) {
    console.error('Error getting siguiente hoja:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener el siguiente número de hoja' 
    });
  }
});

// POST - Subir múltiples fotos para una hoja
router.post('/subir-fotos', auth, [
  body('id_hoja').notEmpty().isInt({ min: 1 }),
  body('fotos').isArray({ min: 5, max: 5 }),
  body('fotos.*.tipo_foto').isIn(['lateral_derecha', 'lateral_izquierda', 'frontal', 'trasero', 'odometro']),
  body('fotos.*.foto').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id_hoja, fotos } = req.body;

    // Verificar que la hoja existe
    const [hoja] = await pool.execute(
      'SELECT id_hoja FROM FLVEHI.FLVEH_T001 WHERE id_hoja = ? AND estado = "ING"',
      [id_hoja]
    );

    if (hoja.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hoja de salida no encontrada'
      });
    }

    // Eliminar fotos existentes de esta hoja
    await pool.execute(
      'DELETE FROM FLVEHI.FLVEH_F001 WHERE id_hoja = ?',
      [id_hoja]
    );

    // Insertar las nuevas fotos
    for (const foto of fotos) {
      await pool.execute(
        `INSERT INTO FLVEHI.FLVEH_F001 (
          id_hoja, id_empresa, tipo_hoja, foto, id_usuario, 
          fe_registro, fe_modificacion, estado, tipo_foto, 
          nombre_archivo, tamano_archivo, tipo_mime
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)`,
        [
          id_hoja, 1, 'S', foto.foto, req.user.id_usuario,
          'ING', foto.tipo_foto, foto.nombre_archivo || '',
          foto.tamano_archivo || 0, foto.tipo_mime || 'image/jpeg'
        ]
      );
    }

    res.json({
      success: true,
      message: 'Fotos subidas exitosamente',
      data: { fotos_subidas: fotos.length }
    });

  } catch (error) {
    console.error('Error subiendo fotos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al subir las fotos' 
    });
  }
});

// GET - Obtener fotos de una hoja específica
router.get('/hoja/:id/fotos', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [fotos] = await pool.execute(
      `SELECT id_foto, tipo_foto, nombre_archivo, tamano_archivo, tipo_mime, 
              fe_registro, estado
       FROM FLVEHI.FLVEH_F001 
       WHERE id_hoja = ? AND estado = "ING"
       ORDER BY tipo_foto ASC`,
      [id]
    );
    
    res.json({
      success: true,
      data: fotos,
      total: fotos.length
    });
  } catch (error) {
    console.error('Error getting hoja fotos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener las fotos de la hoja' 
    });
  }
});

// GET - Obtener una foto específica
router.get('/foto/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [foto] = await pool.execute(
      'SELECT foto, tipo_mime, nombre_archivo FROM FLVEHI.FLVEH_F001 WHERE id_foto = ?',
      [id]
    );
    
    if (foto.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Foto no encontrada'
      });
    }

    res.set({
      'Content-Type': foto[0].tipo_mime || 'image/jpeg',
      'Content-Disposition': `inline; filename="${foto[0].nombre_archivo || 'foto.jpg'}"`
    });
    
    res.send(foto[0].foto);
  } catch (error) {
    console.error('Error getting foto:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener la foto' 
    });
  }
});

// POST - Subir foto de item individual
router.post('/subir-foto-item', auth, [
  body('id_hoja').notEmpty().isInt({ min: 1 }),
  body('id_check').notEmpty().isInt({ min: 1 }),
  body('foto').notEmpty(),
  body('nombre_archivo').optional().trim(),
  body('tamano_archivo').optional().isInt({ min: 1 }),
  body('tipo_mime').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id_hoja, id_check, foto, nombre_archivo, tamano_archivo, tipo_mime } = req.body;

    // Verificar que la hoja existe
    const [hoja] = await pool.execute(
      'SELECT id_hoja FROM FLVEHI.FLVEH_T001 WHERE id_hoja = ? AND estado = "ING"',
      [id_hoja]
    );

    if (hoja.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hoja de salida no encontrada'
      });
    }

    // Verificar que el item existe
    const [item] = await pool.execute(
      'SELECT id_check FROM FLVEHI.FLVEH_M007 WHERE id_check = ? AND estado = "ACT"',
      [id_check]
    );

    if (item.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item de checklist no encontrado'
      });
    }

    // Eliminar foto existente de este item en esta hoja
    await pool.execute(
      'DELETE FROM FLVEHI.FLVEH_F002 WHERE id_hoja = ? AND id_check = ?',
      [id_hoja, id_check]
    );

    // Insertar la nueva foto
    await pool.execute(
      `INSERT INTO FLVEHI.FLVEH_F002 (
        id_hoja, id_check, id_empresa, tipo_hoja, foto, id_usuario, 
        fe_registro, fe_modificacion, estado, nombre_archivo, tamano_archivo, tipo_mime
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?)`,
      [
        id_hoja, id_check, 1, 'S', foto, req.user.id_usuario,
        'ING', nombre_archivo || '', tamano_archivo || 0, tipo_mime || 'image/jpeg'
      ]
    );

    res.json({
      success: true,
      message: 'Foto del item subida exitosamente'
    });

  } catch (error) {
    console.error('Error subiendo foto item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al subir la foto del item' 
    });
  }
});

// GET - Obtener fotos de items de una hoja específica
router.get('/hoja/:id/fotos-items', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [fotos] = await pool.execute(
      `SELECT f.id_foto_item, f.id_check, f.nombre_archivo, f.tamano_archivo, f.tipo_mime, 
              f.fe_registro, f.estado, c.desc_check
       FROM FLVEHI.FLVEH_F002 f
       LEFT JOIN FLVEHI.FLVEH_M007 c ON f.id_check = c.id_check
       WHERE f.id_hoja = ? AND f.estado = "ING"
       ORDER BY f.fe_registro ASC`,
      [id]
    );
    
    res.json({
      success: true,
      data: fotos,
      total: fotos.length
    });
  } catch (error) {
    console.error('Error getting fotos items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener las fotos de los items' 
    });
  }
});

// GET - Obtener una foto de item específica
router.get('/foto-item/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [foto] = await pool.execute(
      'SELECT foto, tipo_mime, nombre_archivo FROM FLVEHI.FLVEH_F002 WHERE id_foto_item = ?',
      [id]
    );
    
    if (foto.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Foto del item no encontrada'
      });
    }

    res.set({
      'Content-Type': foto[0].tipo_mime || 'image/jpeg',
      'Content-Disposition': `inline; filename="${foto[0].nombre_archivo || 'foto_item.jpg'}"`
    });
    
    res.send(foto[0].foto);
  } catch (error) {
    console.error('Error getting foto item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener la foto del item' 
    });
  }
});

// DELETE - Eliminar foto de item
router.delete('/foto-item/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM FLVEHI.FLVEH_F002 WHERE id_foto_item = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Foto del item no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Foto del item eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting foto item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al eliminar la foto del item' 
    });
  }
});

// PUT - Actualizar hoja con imagen y vale de combustible
router.put('/hoja/:id', auth, [
  body('lectura_km_pic').optional().trim(),
  body('vale_id').optional().isInt({ min: 1 }),
  body('porcentaje_combustible').optional().isFloat({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const { id } = req.params;
    const { lectura_km_pic, vale_id, porcentaje_combustible } = req.body;
    
    // Validar campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Actualizar la hoja con los nuevos campos
    const updateFields = [];
    const updateValues = [];
    
    if (lectura_km_pic !== undefined) {
      updateFields.push('lectura_km_pic = ?');
      updateValues.push(lectura_km_pic);
    }
    
    if (vale_id !== undefined) {
      updateFields.push('id_vale = ?');
      updateValues.push(vale_id);
    }
    
    if (porcentaje_combustible !== undefined) {
      updateFields.push('porcentaje_tanque = ?');
      updateValues.push(porcentaje_combustible);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay campos para actualizar'
      });
    }
    
    updateFields.push('fe_modificacion = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    await pool.execute(
      `UPDATE FLVEHI.FLVEH_T001 
       SET ${updateFields.join(', ')} 
       WHERE id_hoja = ? AND estado = "ACT"`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Hoja actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating hoja:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar la hoja' 
    });
  }
});

// GET - Obtener hojas de salida para autorización (estado ING)
router.get('/autorizacion/hojas', auth, async (req, res) => {
  try {
    const { 
      no_hoja, 
      plataforma, 
      placa, 
      piloto, 
      estado = 'ING', 
      tipo_hoja = 'S' 
    } = req.query;

    let whereConditions = ['h.estado = ?', 'h.tipo_hoja = ?'];
    let queryParams = [estado, tipo_hoja];

    // Construir condiciones de búsqueda dinámicas
    if (no_hoja) {
      whereConditions.push('h.id_hoja LIKE ?');
      queryParams.push(`%${no_hoja}%`);
    }
    if (plataforma) {
      whereConditions.push('h.id_plataforma LIKE ?');
      queryParams.push(`%${plataforma}%`);
    }
    if (placa) {
      whereConditions.push('v.placa_id LIKE ?');
      queryParams.push(`%${placa}%`);
    }
    if (piloto) {
      whereConditions.push('(p.nombres LIKE ? OR p.apellidos LIKE ?)');
      queryParams.push(`%${piloto}%`, `%${piloto}%`);
    }

    const [hojas] = await pool.execute(
      `SELECT 
        h.id_hoja,
        h.id_piloto,
        h.id_vehiculo,
        h.id_plataforma,
        h.placa_id,
        h.lectura_km_num,
        h.observaciones,
        h.fe_registro,
        h.id_vale,
        h.estado,
        p.nombres,
        p.apellidos,
        v.marca_vehiculo,
        v.modelo,
        v.placa_id as placa_vehiculo
       FROM FLVEHI.FLVEH_T001 h
       LEFT JOIN FLVEHI.FLVEH_M004 p ON h.id_piloto = p.id_piloto
       LEFT JOIN FLVEHI.FLVEH_M001 v ON h.id_vehiculo = v.id_vehiculo
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY h.fe_registro DESC`,
      queryParams
    );

    // Obtener items con observaciones para cada hoja
    const hojasConItems = await Promise.all(
      hojas.map(async (hoja) => {
        const [items] = await pool.execute(
          `SELECT t2.id_check, t2.anotacion, m7.desc_check
           FROM FLVEHI.FLVEH_T002 t2
           LEFT JOIN FLVEHI.FLVEH_M007 m7 ON t2.id_check = m7.id_check
           WHERE t2.id_hoja = ? AND t2.anotacion IS NOT NULL AND t2.anotacion != ''
           ORDER BY t2.fe_registro ASC`,
          [hoja.id_hoja]
        );

        return {
          ...hoja,
          items_con_observaciones: items
        };
      })
    );

    res.json({
      success: true,
      data: hojasConItems,
      total: hojasConItems.length
    });
  } catch (error) {
    console.error('Error getting hojas for authorization:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener las hojas para autorización' 
    });
  }
});

// POST - Autorizar hoja de salida
router.post('/autorizacion/autorizar', auth, [
  body('id_hoja').notEmpty().isInt({ min: 1 })
], async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id_hoja } = req.body;

    console.log(`🔍 Iniciando autorización de hoja ${id_hoja}`);

    // Verificar que la hoja existe y está en estado ING
    const [hoja] = await connection.execute(
      'SELECT id_hoja, estado, lectura_km_num FROM FLVEHI.FLVEH_T001 WHERE id_hoja = ? AND estado = "ING"',
      [id_hoja]
    );

    if (hoja.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Hoja de salida no encontrada o ya no está en estado ING'
      });
    }

    // Buscar el vale asociado a esta hoja de salida
    const [vale] = await connection.execute(
      'SELECT id_vale, estado FROM FLVEHI.FLVEH_M010 WHERE id_hoja_salida = ? AND estado = "RES"',
      [id_hoja]
    );

    if (vale.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'No se encontró un vale de combustible asociado a esta hoja de salida'
      });
    }

    const id_vale = vale[0].id_vale;

    console.log('✅ Validaciones completadas, iniciando actualizaciones...');

    // 1. Actualizar FLVEH_T001 (encabezado de Hoja de Salida)
    console.log('📝 Actualizando FLVEH_T001...');
    const lectura_km_num = hoja[0].lectura_km_num;
    await connection.execute(
      'UPDATE FLVEHI.FLVEH_T001 SET id_vale = ?, estado = "AUT", lectura_km_num = ?, fe_modificacion = CURRENT_TIMESTAMP WHERE id_hoja = ?',
      [id_vale, lectura_km_num, id_hoja]
    );
    console.log(`✅ FLVEH_T001 actualizado con lectura_km_num: ${lectura_km_num}`);

    // 2. Actualizar FLVEH_T002 (detalle de Hoja de Salida)
    console.log('📝 Actualizando FLVEH_T002...');
    await connection.execute(
      'UPDATE FLVEHI.FLVEH_T002 SET estado = "AUT", fe_modificacion = CURRENT_TIMESTAMP WHERE id_hoja = ?',
      [id_hoja]
    );

    // 3. Actualizar FLVEH_F001 (fotos de motocicleta)
    console.log('📝 Actualizando FLVEH_F001...');
    await connection.execute(
      'UPDATE FLVEHI.FLVEH_F001 SET estado = "AUT", fe_modificacion = CURRENT_TIMESTAMP WHERE id_hoja = ?',
      [id_hoja]
    );

    // 4. Actualizar FLVEH_F002 (fotos de items)
    console.log('📝 Actualizando FLVEH_F002...');
    await connection.execute(
      'UPDATE FLVEHI.FLVEH_F002 SET estado = "AUT", fe_modificacion = CURRENT_TIMESTAMP WHERE id_hoja = ?',
      [id_hoja]
    );

    // 5. Actualizar FLVEH_M010 (vale de combustible)
    console.log('📝 Actualizando FLVEH_M010...');
    await connection.execute(
      'UPDATE FLVEHI.FLVEH_M010 SET estado = "AUT", id_hoja_salida = ?, fe_modificacion = CURRENT_TIMESTAMP WHERE id_vale = ?',
      [id_hoja, id_vale]
    );

    // 6. Actualizar FLVEH_M004 (pilotos) - agregar id_hoja
    console.log('📝 Actualizando FLVEH_M004...');
    const [pilotoResult] = await connection.execute(
      'SELECT id_piloto FROM FLVEHI.FLVEH_T001 WHERE id_hoja = ?',
      [id_hoja]
    );
    
    if (pilotoResult.length > 0) {
      const id_piloto = pilotoResult[0].id_piloto;
      await connection.execute(
        'UPDATE FLVEHI.FLVEH_M004 SET id_hoja = ?, fe_modificacion = CURRENT_TIMESTAMP WHERE id_piloto = ?',
        [id_hoja, id_piloto]
      );
      console.log(`✅ FLVEH_M004 actualizado para piloto ${id_piloto} con hoja ${id_hoja}`);
    } else {
      console.log('⚠️ No se encontró piloto para la hoja');
    }

    // 7. Actualizar FLVEH_M001 (vehículos) - agregar id_hoja y actualizar kilometraje
    console.log('📝 Actualizando FLVEH_M001...');
    const [vehiculoResult] = await connection.execute(
      'SELECT id_vehiculo, lectura_km_num FROM FLVEHI.FLVEH_T001 WHERE id_hoja = ?',
      [id_hoja]
    );
    
    if (vehiculoResult.length > 0) {
      const id_vehiculo = vehiculoResult[0].id_vehiculo;
      const lectura_km_num = vehiculoResult[0].lectura_km_num;
      
      await connection.execute(
        'UPDATE FLVEHI.FLVEH_M001 SET id_hoja = ?, kilometraje = ?, fe_modificacion = CURRENT_TIMESTAMP WHERE id_vehiculo = ?',
        [id_hoja, lectura_km_num, id_vehiculo]
      );
      console.log(`✅ FLVEH_M001 actualizado para vehículo ${id_vehiculo} con hoja ${id_hoja} y kilometraje ${lectura_km_num}`);
    } else {
      console.log('⚠️ No se encontró vehículo para la hoja');
    }

    await connection.commit();
    console.log('✅ Autorización completada exitosamente');

    res.json({
      success: true,
      message: 'Hoja de salida autorizada exitosamente',
      data: {
        id_hoja: id_hoja,
        id_vale: id_vale,
        estado: 'AUT'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error authorizing hoja:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Error al autorizar la hoja de salida',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// POST - Rechazar hoja de salida
router.post('/autorizacion/rechazar', auth, [
  body('id_hoja').notEmpty().isInt({ min: 1 }),
  body('observaciones').optional().trim().escape()
], async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Validar campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id_hoja, observaciones } = req.body;
    const usuario = req.user.usuario; // Obtener usuario del token
    const fechaHora = new Date().toLocaleString('es-GT');

    console.log(`🔍 Iniciando rechazo de hoja ${id_hoja} por usuario ${usuario}`);

    await connection.beginTransaction();

    // Verificar que la hoja existe y está en estado ING
    const [hoja] = await connection.execute(
      'SELECT id_hoja, estado, observaciones as obs_actuales, id_piloto, id_vehiculo FROM FLVEHI.FLVEH_T001 WHERE id_hoja = ? AND estado = "ING"',
      [id_hoja]
    );

    if (hoja.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Hoja de salida no encontrada o ya no está en estado ING'
      });
    }

    const hojaData = hoja[0];
    const observacionesActualizadas = `${hojaData.obs_actuales || ''}**CANCELADA, por ${usuario} ${fechaHora}`;

    console.log('✅ Validaciones completadas, iniciando actualizaciones de rechazo...');

    // 1. Actualizar FLVEH_T001 (encabezado de Hoja de Salida)
    console.log('📝 Actualizando FLVEH_T001...');
    await connection.execute(
      'UPDATE FLVEHI.FLVEH_T001 SET estado = "CAN", observaciones = ?, fe_modificacion = CURRENT_TIMESTAMP WHERE id_hoja = ?',
      [observacionesActualizadas, id_hoja]
    );

    // 2. Actualizar FLVEH_T002 (detalle de Hoja de Salida)
    console.log('📝 Actualizando FLVEH_T002...');
    await connection.execute(
      'UPDATE FLVEHI.FLVEH_T002 SET estado = "CAN", fe_modificacion = CURRENT_TIMESTAMP WHERE id_hoja = ?',
      [id_hoja]
    );

    // 3. Actualizar FLVEH_F001 (fotos de motocicleta)
    console.log('📝 Actualizando FLVEH_F001...');
    await connection.execute(
      'UPDATE FLVEHI.FLVEH_F001 SET estado = "CAN", fe_modificacion = CURRENT_TIMESTAMP WHERE id_hoja = ?',
      [id_hoja]
    );

    // 4. Actualizar FLVEH_F002 (fotos de items)
    console.log('📝 Actualizando FLVEH_F002...');
    await connection.execute(
      'UPDATE FLVEHI.FLVEH_F002 SET estado = "CAN", fe_modificacion = CURRENT_TIMESTAMP WHERE id_hoja = ?',
      [id_hoja]
    );

    // 5. Actualizar FLVEH_M004 (pilotos) - resetear id_hoja a 0
    console.log('📝 Actualizando FLVEH_M004...');
    const [pilotoResult] = await connection.execute(
      'SELECT id_piloto FROM FLVEHI.FLVEH_T001 WHERE id_hoja = ?',
      [id_hoja]
    );
    
    if (pilotoResult.length > 0) {
      const id_piloto = pilotoResult[0].id_piloto;
      await connection.execute(
        'UPDATE FLVEHI.FLVEH_M004 SET id_hoja = 0, fe_modificacion = CURRENT_TIMESTAMP WHERE id_piloto = ?',
        [id_piloto]
      );
      console.log(`✅ FLVEH_M004 actualizado para piloto ${id_piloto} con id_hoja = 0`);
    } else {
      console.log('⚠️ No se encontró piloto para la hoja');
    }

    // 6. Actualizar FLVEH_M001 (vehículos) - resetear id_hoja a 0
    console.log('📝 Actualizando FLVEH_M001...');
    const [vehiculoResult] = await connection.execute(
      'SELECT id_vehiculo FROM FLVEHI.FLVEH_T001 WHERE id_hoja = ?',
      [id_hoja]
    );
    
    if (vehiculoResult.length > 0) {
      const id_vehiculo = vehiculoResult[0].id_vehiculo;
      await connection.execute(
        'UPDATE FLVEHI.FLVEH_M001 SET id_hoja = 0, fe_modificacion = CURRENT_TIMESTAMP WHERE id_vehiculo = ?',
        [id_vehiculo]
      );
      console.log(`✅ FLVEH_M001 actualizado para vehículo ${id_vehiculo} con id_hoja = 0`);
    } else {
      console.log('⚠️ No se encontró vehículo para la hoja');
    }

    // 7. Insertar en el log de actividades
    console.log('📝 Insertando en log de actividades...');
    const id_empresaLOG = req.user.id_empresa;
    const id_accionLOG = "CAN_HOJA_ES";
    const id_usuarioLOG = req.user.id_usuario;
    const usuarioLOG = req.user.usuario;
    const observacionesLOG = `Hoja cancelada - ID: ${id_hoja}`;
    const estadoLOG = 'ACT';
    
    console.log("🔐 Datos del log:", {
      id_empresa: id_empresaLOG,
      id_accion: id_accionLOG,
      id_usuario: id_usuarioLOG,
      usuario: usuarioLOG,
      observaciones: observacionesLOG,
      estado: estadoLOG
    });
    
    await connection.execute(
      `INSERT INTO flvehi.flveh_s099 (
        id_empresa, id_accion, id_usuario, usuario, observaciones, estado, fe_registro
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id_empresaLOG, id_accionLOG, id_usuarioLOG, usuarioLOG, observacionesLOG, estadoLOG]
    );
    console.log('✅ Log de actividades insertado exitosamente');

    await connection.commit();
    console.log('✅ Rechazo completado exitosamente');    

    res.json({
      success: true,
      message: 'Hoja de salida rechazada exitosamente',
      data: {
        id_hoja: id_hoja,
        estado: 'CAN',
        observaciones: observacionesActualizadas
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error rechazando hoja:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Error al rechazar la hoja de salida',
      details: error.message
    });
  } finally {
    connection.release();
  }
});

// GET - Obtener fotos de una hoja específica para autorización
router.get('/autorizacion/hoja/:id/fotos', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener fotos de motocicleta (FLVEH_F001) con datos de imagen
    const [fotosMotocicleta] = await pool.execute(
      `SELECT id_foto, tipo_foto, nombre_archivo, tamano_archivo, tipo_mime, 
              fe_registro, estado, foto
       FROM FLVEHI.FLVEH_F001 
       WHERE id_hoja = ? AND estado = "ING" AND tipo_hoja = 'S'
       ORDER BY tipo_foto ASC`,
      [id]
    );

    // Obtener fotos de items (FLVEH_F002) con datos de imagen
    const [fotosItems] = await pool.execute(
      `SELECT f.id_foto_item, f.id_check, f.nombre_archivo, f.tamano_archivo, f.tipo_mime, 
              f.fe_registro, f.estado, f.foto, c.desc_check
       FROM FLVEHI.FLVEH_F002 f
       LEFT JOIN FLVEHI.FLVEH_M007 c ON f.id_check = c.id_check
       WHERE f.id_hoja = ? AND f.estado = "ING"
       ORDER BY f.fe_registro ASC`,
      [id]
    );

    // Convertir los datos de foto a string base64
    const fotosMotocicletaBase64 = fotosMotocicleta.map(foto => {
      let fotoBase64 = '';
      if (typeof foto.foto === 'string') {
        fotoBase64 = foto.foto;
      } else if (Buffer.isBuffer(foto.foto)) {
        fotoBase64 = foto.foto.toString('utf8');
      } else if (foto.foto && typeof foto.foto.toString === 'function') {
        fotoBase64 = foto.foto.toString('utf8');
      }
      
      return {
        id_foto: foto.id_foto,
        tipo_foto: foto.tipo_foto,
        nombre_archivo: foto.nombre_archivo,
        tamano_archivo: foto.tamano_archivo,
        tipo_mime: foto.tipo_mime,
        fe_registro: foto.fe_registro,
        estado: foto.estado,
        foto_base64: fotoBase64
      };
    });

    const fotosItemsBase64 = fotosItems.map(foto => {
      let fotoBase64 = '';
      if (typeof foto.foto === 'string') {
        fotoBase64 = foto.foto;
      } else if (Buffer.isBuffer(foto.foto)) {
        fotoBase64 = foto.foto.toString('utf8');
      } else if (foto.foto && typeof foto.foto.toString === 'function') {
        fotoBase64 = foto.foto.toString('utf8');
      }
      
      return {
        id_foto_item: foto.id_foto_item,
        id_check: foto.id_check,
        nombre_archivo: foto.nombre_archivo,
        tamano_archivo: foto.tamano_archivo,
        tipo_mime: foto.tipo_mime,
        fe_registro: foto.fe_registro,
        estado: foto.estado,
        desc_check: foto.desc_check,
        foto_base64: fotoBase64
      };
    });
    
    res.json({
      success: true,
      data: {
        fotos_motocicleta: fotosMotocicletaBase64,
        fotos_items: fotosItemsBase64
      },
      total: {
        motocicleta: fotosMotocicletaBase64.length,
        items: fotosItemsBase64.length
      }
    });
  } catch (error) {
    console.error('Error getting hoja fotos for authorization:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener las fotos de la hoja' 
    });
  }
});

// PUT - Rechazar hoja de salida
router.put('/autorizacion/hoja/:id/rechazar', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la hoja existe y está en estado ING
    const [hoja] = await pool.execute(
      'SELECT id_hoja, estado FROM FLVEHI.FLVEH_T001 WHERE id_hoja = ? AND estado = "ING"',
      [id]
    );
    
    if (hoja.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hoja no encontrada o no está en estado ING'
      });
    }
    
    // Actualizar el estado a CAN (Cancelado)
    await pool.execute(
      'UPDATE FLVEHI.FLVEH_T001 SET estado = "CAN", fe_modificacion = NOW() WHERE id_hoja = ?',
      [id]
    );
    
    console.log(`Hoja ${id} rechazada exitosamente`);
    
    res.json({
      success: true,
      message: 'Hoja rechazada exitosamente',
      data: {
        id_hoja: id,
        estado: 'CAN'
      }
    });
  } catch (error) {
    console.error('Error rechazando hoja:', error);
    res.status(500).json({
      success: false,
      error: 'Error al rechazar la hoja'
    });
  }
});

module.exports = router;
