const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../../../config/database');
const { auth } = require('../../../middleware/auth');

const router = express.Router();

// GET - Obtener hojas de salida disponibles para entrada
router.get('/hojas-salida-disponibles', auth, async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    
    const [hojas] = await pool.execute(
      `SELECT DISTINCT h1.id_hoja, h1.id_plataforma, h1.id_piloto, h1.id_vehiculo, h1.placa_id, h1.lectura_km_num, h1.porcentaje_tanque, h1.observaciones, h1.fe_registro
       FROM flvehi.flveh_t001 h1
       WHERE h1.tipo_hoja = 'S'
         AND h1.estado = 'AUT'
         AND NOT EXISTS (
           SELECT 1
           FROM flvehi.flveh_t001 h2
           WHERE h2.id_hoja = h1.id_hoja
             AND h2.tipo_hoja = 'E'
         )
         AND h1.id_usuario = ?
       ORDER BY h1.fe_registro DESC`,
      [id_usuario]
    );

    // Formatear datos para el frontend
    const hojasFormateadas = hojas.map(hoja => ({
      id_hoja: hoja.id_hoja,
      display_text: `${hoja.id_plataforma}-${hoja.id_hoja}`,
      id_plataforma: hoja.id_plataforma,
      id_piloto: hoja.id_piloto,
      id_vehiculo: hoja.id_vehiculo,
      placa_id: hoja.placa_id,
      lectura_km_num: hoja.lectura_km_num,
      porcentaje_tanque: hoja.porcentaje_tanque,
      observaciones: hoja.observaciones,
      fe_registro: hoja.fe_registro
    }));

    res.json({
      success: true,
      data: hojasFormateadas
    });

  } catch (error) {
    console.error('Error getting available hojas de salida:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener las hojas de salida disponibles' 
    });
  }
});

// GET - Obtener items revisados de una hoja de salida
router.get('/items-revisados/:id_hoja', auth, async (req, res) => {
  try {
    const { id_hoja } = req.params;

    const [items] = await pool.execute(
      `SELECT t2.*, m7.desc_check, m7.cod_abreviado
       FROM flvehi.flveh_t002 t2
       LEFT JOIN flvehi.flveh_m007 m7 ON t2.id_check = m7.id_check
       WHERE t2.id_hoja = ? AND t2.tipo_hoja = 'S' AND t2.estado = 'AUT'
       ORDER BY t2.fe_registro ASC`,
      [id_hoja]
    );

    res.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Error getting items revisados:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener los items revisados' 
    });
  }
});

// GET - Obtener datos completos de hoja de salida
router.get('/hoja-salida/:id_hoja/datos', auth, async (req, res) => {
  try {
    const { id_hoja } = req.params;

    const [hoja] = await pool.execute(
      `SELECT h.lectura_km_num, h.placa_id, h.id_plataforma, h.id_piloto, h.id_vehiculo,
              p.nombres, p.apellidos, v.marca_vehiculo, v.modelo
       FROM flvehi.flveh_t001 h
       LEFT JOIN flvehi.flveh_m004 p ON h.id_piloto = p.id_piloto
       LEFT JOIN flvehi.flveh_m001 v ON h.id_vehiculo = v.id_vehiculo
       WHERE h.id_hoja = ? AND h.tipo_hoja = 'S' AND h.estado = 'AUT'`,
      [id_hoja]
    );

    if (hoja.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hoja de salida no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        lectura_km_num: hoja[0].lectura_km_num,
        placa_id: hoja[0].placa_id,
        id_plataforma: hoja[0].id_plataforma,
        id_piloto: hoja[0].id_piloto,
        id_vehiculo: hoja[0].id_vehiculo,
        piloto_nombre: `${hoja[0].nombres} ${hoja[0].apellidos}`,
        vehiculo_info: `${hoja[0].marca_vehiculo} ${hoja[0].modelo}`
      }
    });

  } catch (error) {
    console.error('Error getting datos hoja salida:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener los datos de la hoja de salida' 
    });
  }
});

// GET - Obtener items de checklist
router.get('/items', auth, async (req, res) => {
  try {
    const [items] = await pool.execute(
      'SELECT * FROM flvehi.flveh_m007 WHERE estado = "ACT" ORDER BY desc_check ASC'
    );

    res.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener los items' 
    });
  }
});

// POST - Crear hoja de entrada
router.post('/hoja', auth, [
  body('id_hoja_salida').notEmpty().isInt({ min: 1 }),
  body('lectura_km_num').notEmpty().isInt({ min: 0 }),
  body('porcentaje_tanque').notEmpty().isFloat({ min: 0, max: 100 }),
  body('monto_recaudado').notEmpty().isFloat({ min: 0.01 }),
  body('observaciones').optional().trim().escape()
], async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Validar campos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      id_hoja_salida,
      lectura_km_num,
      porcentaje_tanque,
      monto_recaudado,
      observaciones,
      items_revisados = [],
      fotos_data = [],
      fotos_items_data = []
    } = req.body;

    // Obtener datos de la Hoja de Salida para heredar
    const [hojaSalidaData] = await connection.execute(
      `SELECT id_hoja, id_plataforma, id_piloto, id_vehiculo, placa_id, lectura_km_pic, lectura_km_txt
       FROM FLVEHI.FLVEH_T001 
       WHERE id_hoja = ? AND tipo_hoja = 'S' AND estado = 'AUT'`,
      [id_hoja_salida]
    );

    if (hojaSalidaData.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Hoja de Salida no encontrada o no autorizada'
      });
    }

    const hojaSalida = hojaSalidaData[0];
    const id_hoja_entrada = hojaSalida.id_hoja; // Usar el mismo id_hoja

    // Insertar en FLVEH_T001 (maestro de entrada) - heredando datos de la Hoja de Salida
    await connection.execute(
      `INSERT INTO FLVEHI.FLVEH_T001 (
        id_hoja, id_empresa, id_plataforma, id_piloto, id_vehiculo, placa_id, 
        lectura_km_pic, lectura_km_txt, tipo_hoja, id_hoja_referencia, 
        lectura_km_num, porcentaje_tanque, monto_recaudado, id_usuario, observaciones, 
        fe_registro, fe_modificacion, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
      [
        id_hoja_entrada, 1, hojaSalida.id_plataforma, hojaSalida.id_piloto, hojaSalida.id_vehiculo, hojaSalida.placa_id, 
        hojaSalida.lectura_km_pic, hojaSalida.lectura_km_txt, 'E', 0, lectura_km_num, porcentaje_tanque, 
        monto_recaudado, req.user.id_usuario, observaciones || '', 'AUT'
      ]
    );

    // Insertar items revisados en FLVEH_T002
    for (const item of items_revisados) {
      await connection.execute(
        `INSERT INTO FLVEHI.FLVEH_T002 (
          id_hoja, id_empresa, id_check, anotacion, id_usuario, 
          tiempo_inicio, tiempo_final, tipo_hoja, fe_registro, fe_modificacion, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
        [
          id_hoja_entrada, 1, item.id_check, item.anotacion || '', req.user.id_usuario,
          '', '', 'E', 'ING'
        ]
      );
    }

    // Insertar fotos en FLVEH_F001 (fotos de motocicleta)
    if (fotos_data.length === 5) {
      for (let i = 0; i < fotos_data.length; i++) {
        await connection.execute(
          `INSERT INTO FLVEHI.FLVEH_F001 (
            id_hoja, id_empresa, tipo_hoja, foto, id_usuario, 
            fe_registro, fe_modificacion, estado, tipo_foto, 
            nombre_archivo, tamano_archivo, tipo_mime
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)`,
          [
            id_hoja_entrada, 1, 'E', fotos_data[i].foto, req.user.id_usuario,
            'ING', fotos_data[i].tipo_foto, fotos_data[i].nombre_archivo || '',
            fotos_data[i].tamano_archivo || 0, fotos_data[i].tipo_mime || 'image/jpeg'
          ]
        );
      }
    }

    // Insertar fotos de items en FLVEH_F002 (fotos de items)
    for (const fotoItem of fotos_items_data) {
      await connection.execute(
        `INSERT INTO FLVEHI.FLVEH_F002 (
          id_hoja, id_empresa, id_check, foto, nombre_archivo, tamano_archivo, 
          tipo_mime, id_usuario, fe_registro, fe_modificacion, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
        [
          id_hoja_entrada, 1, fotoItem.id_check, fotoItem.foto, 
          fotoItem.nombre_archivo, fotoItem.tamano_archivo,
          fotoItem.tipo_mime, req.user.id_usuario, 'ING'
        ]
      );
    }

    // Actualizar piloto para liberarlo (id_hoja = 0)
    await connection.execute(
      'UPDATE FLVEHI.FLVEH_M004 SET id_hoja = 0, fe_modificacion = CURRENT_TIMESTAMP WHERE id_piloto = ?',
      [hojaSalida.id_piloto]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Hoja de entrada creada exitosamente',
      data: { id_hoja: id_hoja_entrada }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating hoja de entrada:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al crear la hoja de entrada' 
    });
  } finally {
    connection.release();
  }
});

// POST - Agregar item revisado
router.post('/item-revisado', auth, [
  body('id_hoja').notEmpty().isInt({ min: 1 }),
  body('id_check').notEmpty().isInt({ min: 1 }),
  body('anotacion').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id_hoja, id_check, anotacion } = req.body;

    await pool.execute(
      `INSERT INTO FLVEHI.FLVEH_T002 (
        id_hoja, id_empresa, id_check, anotacion, id_usuario, 
        tiempo_inicio, tiempo_final, tipo_hoja, fe_registro, fe_modificacion, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
      [
        id_hoja, 1, id_check, anotacion || '', req.user.id_usuario,
        '', '', 'E', 'ING'
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

// POST - Subir fotos de motocicleta
router.post('/subir-fotos', auth, [
  body('id_hoja').notEmpty().isInt({ min: 1 }),
  body('fotos').isArray({ min: 5, max: 5 })
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

    const { id_hoja, fotos } = req.body;

    // Insertar cada foto
    for (let i = 0; i < fotos.length; i++) {
      await connection.execute(
        `INSERT INTO FLVEHI.FLVEH_F001 (
          id_hoja, id_empresa, tipo_foto, foto, nombre_archivo, tamano_archivo, 
          tipo_mime, id_usuario, fe_registro, fe_modificacion, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
        [
          id_hoja, 1, `foto_${i + 1}`, fotos[i].foto, 
          fotos[i].nombre_archivo, fotos[i].tamano_archivo,
          fotos[i].tipo_mime, req.user.id_usuario, 'ING'
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Fotos subidas exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error uploading fotos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al subir las fotos' 
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
