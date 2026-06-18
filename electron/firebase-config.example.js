// 1. CREDENCIALES DE DESARROLLO (Tu base de datos de pruebas)
const devConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    databaseId: "TU_DATABASE_ID", // En entorno de desarrollo, se suele utilizar (default), si es que este no se cambio el nombre manualmente en firebase
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_STORAGE_BUCKET",
    appId: "TU_STORAGE_BUCKET",
    measurementId: "TU_MEASUREMENT_ID"
};

// 2. CREDENCIALES DE PRODUCCIÓN (La base de datos real de la estación)
// Reemplaza estos strings con las credenciales reales de los bomberos
const prodConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    databaseId: "TU_DATABASE_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_STORAGE_BUCKET",
    appId: "TU_STORAGE_BUCKET",
    measurementId: "TU_MEASUREMENT_ID"
};

// 3. EL INTERRUPTOR DE ENTORNO
// ==========================================
// ⚠️ ¡ALERTA ANTES DE COMPILAR EL .EXE!
// 'dev'  -> Para programar en mi PC (Base de datos de pruebas)
// 'prod' -> Para generar el instalador de la Estación de Bomberos
//        -> Luego ejecutar "npm run electron:build" en la terminal para compilar y crear el .exe de produccion.
// ==========================================
const ENVIRONMENT = 'dev';

// Asignación automática de la configuración activa
const firebaseConfig = ENVIRONMENT === 'prod' ? prodConfig : devConfig;

// EXPORTACIÓN CRÍTICA: Solo exportamos la configuración.
// La inicialización de Firebase se realiza únicamente en firebase-sync.js para evitar doble inicialización.
export { firebaseConfig };