# Sistema de Información de Registro de Servicios - Bomberos USM

Sistemas de escritorio nativo diseñado para la gestión, control y automatización de las bitácoras de servicios, reportes e incidencias del Cuerpo de Bomberos de la Universidad Santa María.

## 🚀 Características Principales

- **Gestión Offline-First:** Almacenamiento local rápido mediante SQLite para garantizar el funcionamiento del sistema incluso si la estación pierde conexión a Internet.
- **Sincronización en la Nube:** Respaldo automatizado y en tiempo real con Firebase Firestore cuando hay conexión disponible.
- **Generación de Reportes:** Exportación de hojas de servicio y estadísticas del cuerpo de bomberos.
- **Interfaz Moderna:** Diseñada con React, Vite y componentes optimizados para un flujo de trabajo bajo presión.

## 🛠️ Arquitectura y Tecnologías

- **Frontend:** React.js, TypeScript, Tailwind CSS
- **Entorno de Escritorio:** Electron (Arquitectura de procesos separados: Main y Renderer)
- **Empaquetador:** Vite
- **Base de Datos Local:** SQLite
- **Base de Datos en la Nube:** Firebase (Firestore)

## 📦 Instalación y Desarrollo

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Garzaro24/Proyecto_Bomberos_USM.git
   ```
2. **Instalar dependencias nativas y de Node:**
   ```bash
   npm install
   ```
3. **Ejecutar en modo de desarrollo (Live Reload):**
   ```bash
   npm run electron:build
   ```
4. 📦 Compilar y empaquetar para Producción (.exe):
   ```bash
   npm run electron:build
   ```
   Nota: El instalador ejecutable se generará en la carpeta /release.

## 📋 Requisitos del Sistema
- Sistema Operativo: Windows 10 o superior (x64)
- Node.js: v18 o superior (Solo para desarrollo)

## ✒️ Autores
- César Garzaro - Desarrollador de Software / Estudiante de Ingeniería de Sistemas (USM)

## 📨 Contacto
- [https://www.linkedin.com/in/cesar-garzaro]