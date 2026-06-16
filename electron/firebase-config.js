import { initializeApp } from "firebase/app";

// 1. CREDENCIALES DE DESARROLLO (Tu base de datos de pruebas)
const devConfig = {
  apiKey: "AIzaSyAc6dhAWhT6QUi9Sw01eaI9ohS0gNKqCPA",
  authDomain: "bomberos-usm-2026-dev.firebaseapp.com",
  projectId: "bomberos-usm-2026-dev",
  storageBucket: "bomberos-usm-2026-dev.firebasestorage.app",
  messagingSenderId: "417701340119",
  appId: "1:417701340119:web:60fa997696942ba9a9e192",
  measurementId: "G-PKJJG1QJPD"
};

// 2. CREDENCIALES DE PRODUCCIÓN (La base de datos real de la estación)
// Reemplaza estos strings con las credenciales reales de los bomberos
const prodConfig = {
  apiKey: "AIzaSyBe16zZIHVOTjjJE6v5mKBAXBgz0wU35Us",
  authDomain: "bomberos-usm-2026.firebaseapp.com",
  projectId: "bomberos-usm-2026",
  storageBucket: "bomberos-usm-2026.firebasestorage.app",
  messagingSenderId: "1024157030555",
  appId: "1:1024157030555:web:990fd20fc656d8bad30e3e",
  measurementId: "G-0SQ2W8Z418"
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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// EXPORTACIÓN CRÍTICA: Exportamos tanto 'app' para React como 'firebaseConfig' para el proceso de Electron
export { app, firebaseConfig };
