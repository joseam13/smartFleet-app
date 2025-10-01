const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Función para hacer login y obtener token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testuser',
      password: '123456'
    });
    
    if (response.data.token) {
      return response.data.token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Error en login:', error.response?.data || error.message);
    throw error;
  }
}

// Función para obtener hojas de salida disponibles
async function getHojasSalidaDisponibles(token) {
  try {
    console.log('🔍 Obteniendo hojas de salida disponibles...');
    
    const response = await axios.get(`${BASE_URL}/hoja-en/hojas-salida-disponibles`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Hojas de salida obtenidas exitosamente');
      console.log('📊 Cantidad de hojas disponibles:', response.data.data.length);
      
      response.data.data.forEach((hoja, index) => {
        console.log(`  ${index + 1}. ${hoja.display_text} - Piloto: ${hoja.id_piloto}, Vehículo: ${hoja.id_vehiculo}`);
      });
      
      return response.data.data;
    } else {
      console.log('❌ Error obteniendo hojas de salida:', response.data.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error obteniendo hojas de salida:', error.response?.data || error.message);
    return [];
  }
}

// Función para obtener items de checklist
async function getItemsChecklist(token) {
  try {
    console.log('🔍 Obteniendo items de checklist...');
    
    const response = await axios.get(`${BASE_URL}/hoja-en/items`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Items de checklist obtenidos exitosamente');
      console.log('📊 Cantidad de items:', response.data.data.length);
      return response.data.data;
    } else {
      console.log('❌ Error obteniendo items:', response.data.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error obteniendo items:', error.response?.data || error.message);
    return [];
  }
}

// Función para obtener items revisados de una hoja de salida
async function getItemsRevisados(token, idHoja) {
  try {
    console.log(`🔍 Obteniendo items revisados para hoja ${idHoja}...`);
    
    const response = await axios.get(`${BASE_URL}/hoja-en/items-revisados/${idHoja}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Items revisados obtenidos exitosamente');
      console.log('📊 Cantidad de items revisados:', response.data.data.length);
      return response.data.data;
    } else {
      console.log('❌ Error obteniendo items revisados:', response.data.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error obteniendo items revisados:', error.response?.data || error.message);
    return [];
  }
}

// Función para crear una hoja de entrada
async function crearHojaEntrada(token, hojaData) {
  try {
    console.log('🔍 Creando hoja de entrada...');
    console.log('📋 Datos a enviar:', hojaData);
    
    const response = await axios.post(`${BASE_URL}/hoja-en/hoja`, hojaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Respuesta del servidor:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
    if (response.data.success) {
      console.log('✅ Hoja de entrada creada exitosamente');
      console.log('📊 ID de hoja generado:', response.data.data.id_hoja);
      return response.data.data.id_hoja;
    } else {
      console.log('❌ Error creando hoja de entrada:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creando hoja de entrada:', error.response?.data || error.message);
    return null;
  }
}

// Función principal de prueba
async function testHojaEntrada() {
  try {
    console.log('🚀 Iniciando prueba de Hoja de Entrada...\n');
    
    // 1. Login
    console.log('1️⃣ Realizando login...');
    const token = await login();
    console.log('✅ Login exitoso\n');
    
    // 2. Obtener hojas de salida disponibles
    console.log('2️⃣ Obteniendo hojas de salida disponibles...');
    const hojasSalida = await getHojasSalidaDisponibles(token);
    
    if (hojasSalida.length === 0) {
      console.log('⚠️ No hay hojas de salida disponibles para crear entrada');
      return;
    }
    
    // 3. Obtener items de checklist
    console.log('\n3️⃣ Obteniendo items de checklist...');
    const itemsChecklist = await getItemsChecklist(token);
    
    if (itemsChecklist.length === 0) {
      console.log('⚠️ No hay items de checklist disponibles');
      return;
    }
    
    // 4. Obtener items revisados de la primera hoja de salida
    const primeraHoja = hojasSalida[0];
    console.log(`\n4️⃣ Obteniendo items revisados para hoja ${primeraHoja.id_hoja}...`);
    const itemsRevisados = await getItemsRevisados(token, primeraHoja.id_hoja);
    
    // 5. Crear hoja de entrada
    console.log('\n5️⃣ Creando hoja de entrada...');
    const hojaEntradaData = {
      id_hoja_salida: primeraHoja.id_hoja,
      id_piloto: primeraHoja.id_piloto,
      id_vehiculo: primeraHoja.id_vehiculo,
      lectura_km_num: 105000,
      porcentaje_tanque: 85,
      monto_recaudado: 150.50,
      observaciones: 'Prueba de hoja de entrada',
      items_revisados: itemsRevisados.slice(0, 2), // Tomar solo los primeros 2 items
      fotos_data: [] // Sin fotos para la prueba
    };
    
    const idHojaEntrada = await crearHojaEntrada(token, hojaEntradaData);
    
    if (idHojaEntrada) {
      console.log('\n✅ Prueba de Hoja de Entrada completada exitosamente');
      console.log(`📊 ID de hoja de entrada generado: ${idHojaEntrada}`);
      console.log('📊 La funcionalidad está lista para usar');
    } else {
      console.log('\n❌ La prueba de Hoja de Entrada falló');
    }
    
  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testHojaEntrada();
}

module.exports = {
  testHojaEntrada,
  login,
  getHojasSalidaDisponibles,
  getItemsChecklist,
  getItemsRevisados,
  crearHojaEntrada
};


