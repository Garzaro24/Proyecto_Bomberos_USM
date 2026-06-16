import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './database.js';
import * as firebaseSync from './firebase-sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0f172a', // Slate 900 for dark mode parity
    title: 'Sistema de Información - Cuerpo de Bomberos',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Initialize Database
  await db.initDatabase();

  // Initialize Firebase (if configured)
  firebaseSync.initFirebase();

  createWindow();

  // Periodic automatic sync every 60 seconds in the background
  setInterval(async () => {
    try {
      const result = await firebaseSync.syncLocalToCloud();
      if (result.success && mainWindow) {
        mainWindow.webContents.send('cloud:sync-status', result);
      }
    } catch (e) {
      console.error('Auto sync failed:', e);
    }
  }, 60000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ==================== IPC HANDLERS ====================

// --- AUTH ---

ipcMain.handle('auth:login', async (event, username, password) => {
  try {
    if (!username || !password) {
      return { error: 'Por favor complete todos los campos.' };
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password);

    const user = db.getUserByUsername(cleanUsername);

    if (!user) {
      return { error: 'Credenciales inválidas. Usuario no registrado o clave incorrecta.' };
    }

    const { hash } = db.hashPassword(cleanPassword, user.salt);
    if (hash !== user.hash) {
      return { error: 'Credenciales inválidas. Usuario no registrado o clave incorrecta.' };
    }

    const userFirstName = user.firstName || user.name.split(' ')[0] || '';
    const userLastName = user.lastName || user.name.split(' ').slice(1).join(' ') || '';

    return {
      username: user.username,
      name: user.name,
      personnelId: user.personnelId,
      role: user.role,
      bloodType: user.bloodType || 'No especificado',
      firstName: userFirstName,
      lastName: userLastName,
      photoBase64: user.photoBase64
    };
  } catch (err) {
    return { error: 'Error del sistema en login: ' + err.message };
  }
});

ipcMain.handle('auth:register', async (event, userData) => {
  try {
    const { username, password, name, personnelId, role, bloodType, firstName, lastName } = userData;
    if (!username || !password || !name || !personnelId || !bloodType || !firstName || !lastName) {
      return { error: 'Todos los campos son obligatorios.' };
    }

    // 1. Username constraints
    const cleanUsername = String(username).trim().toLowerCase();
    if (!/^[a-z0-9_-]{1,10}$/.test(cleanUsername)) {
      return { 
        error: 'El nombre de usuario debe tener máximo 10 caracteres y contener solo letras minúsculas, números, guiones o guiones bajos.' 
      };
    }

    // 2. Password constraints
    const cleanPassword = String(password);
    if (cleanPassword.length < 6 || cleanPassword.length > 10) {
      return { error: 'La contraseña debe tener entre 6 y 10 caracteres.' };
    }
    if (!/[A-Z]/.test(cleanPassword) || !/\d/.test(cleanPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(cleanPassword)) {
      return { 
        error: 'La contraseña debe incluir obligatoriamente al menos una mayúscula, un número y un carácter especial.' 
      };
    }

    // 3. Name constraints
    const cleanFirstName = String(firstName).trim().toUpperCase();
    const cleanLastName = String(lastName).trim().toUpperCase();

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(cleanFirstName)) {
      return { 
        error: 'El Nombre es obligatorio, de máximo 20 caracteres, y no puede contener números o caracteres especiales.' 
      };
    }

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(cleanLastName)) {
      return { 
        error: 'El Apellido es obligatorio, de máximo 20 caracteres, y no puede contener números o caracteres especiales.' 
      };
    }

    const cleanName = `${cleanFirstName} ${cleanLastName}`;

    // 4. Cédula constraints
    const cleanPersonnelId = String(personnelId).trim().toUpperCase();
    if (!/^[VE]-\d{1,10}$/.test(cleanPersonnelId)) {
      return { 
        error: 'La Cédula de Identidad debe comenzar con V o E, seguida por un guión y un número entero de máximo 10 dígitos.' 
      };
    }

    // 5. Blood type validation
    const cleanBloodType = String(bloodType).trim().toUpperCase();
    const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (!validBloodTypes.includes(cleanBloodType)) {
      return { error: 'El tipo de sangre elegido no es válido.' };
    }

    // Check unique username
    if (db.getUserByUsername(cleanUsername)) {
      return { error: 'El nombre de usuario ya se encuentra registrado.' };
    }

    // Check unique Cédula
    if (db.getUserByPersonnelId(cleanPersonnelId)) {
      return { error: 'La Cédula de Identidad ya se encuentra registrada por otro personal.' };
    }

    // 6. Role validation
    const cleanRole = role ? String(role).trim() : 'Bombero';
    const validRoles = ['Bombero', 'Paramedico', 'Sargento', 'Teniente'];
    if (!validRoles.includes(cleanRole)) {
      return { error: 'El Rango de Despliegue elegido no es válido.' };
    }

    const { salt, hash } = db.hashPassword(cleanPassword);
    const newUserData = {
      username: cleanUsername,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      name: cleanName,
      personnelId: cleanPersonnelId,
      role: cleanRole,
      salt,
      hash,
      bloodType: cleanBloodType
    };

    db.registerUser(newUserData);

    return {
      username: cleanUsername,
      name: cleanName,
      personnelId: cleanPersonnelId,
      role: cleanRole,
      bloodType: cleanBloodType,
      firstName: cleanFirstName,
      lastName: cleanLastName
    };
  } catch (err) {
    return { error: 'Error del servidor al registrar: ' + err.message };
  }
});

ipcMain.handle('auth:update-profile', async (event, data) => {
  try {
    const { username, firstName, lastName, personnelId, bloodType, photoBase64 } = data;
    if (!username || !firstName || !lastName || !personnelId || !bloodType) {
      return { error: 'Todos los campos obligatorios (*) deben completarse.' };
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanFirstName = String(firstName).trim().toUpperCase();
    const cleanLastName = String(lastName).trim().toUpperCase();
    const cleanPersonnelId = String(personnelId).trim().toUpperCase();
    const cleanBloodType = String(bloodType).trim().toUpperCase();

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(cleanFirstName)) {
      return { 
        error: 'El Nombre es obligatorio, de máximo 20 caracteres, y no puede contener números o caracteres especiales.' 
      };
    }

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(cleanLastName)) {
      return { 
        error: 'El Apellido es obligatorio, de máximo 20 caracteres, y no puede contener números o caracteres especiales.' 
      };
    }

    if (!/^[VE]-\d{1,10}$/.test(cleanPersonnelId)) {
      return { 
        error: 'La Cédula de Identidad debe comenzar con V o E, seguida por un guión y un número entero de máximo 10 dígitos.' 
      };
    }

    const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (!validBloodTypes.includes(cleanBloodType)) {
      return { error: 'El tipo de sangre elegido no es válido.' };
    }

    const user = db.getUserByUsername(cleanUsername);
    if (!user) {
      return { error: 'Oficial de bomberos no registrado en el sistema.' };
    }

    // Verify personnelId uniqueness for other users
    const existingWithId = db.getUserByPersonnelId(cleanPersonnelId);
    if (existingWithId && existingWithId.username !== cleanUsername) {
      return { 
        error: 'La Cédula de Identidad ingresada ya pertenece a otro oficial registrado en el sistema.' 
      };
    }

    db.updateProfile(cleanUsername, {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      name: `${cleanFirstName} ${cleanLastName}`,
      personnelId: cleanPersonnelId,
      bloodType: cleanBloodType,
      photoBase64
    });

    const updatedUser = db.getUserByUsername(cleanUsername);

    return {
      username: updatedUser.username,
      name: updatedUser.name,
      personnelId: updatedUser.personnelId,
      role: updatedUser.role,
      bloodType: updatedUser.bloodType,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      photoBase64: updatedUser.photoBase64
    };
  } catch (err) {
    return { error: 'Error del servidor al actualizar perfil: ' + err.message };
  }
});

// --- RECORDS ---

ipcMain.handle('records:get-all', async () => {
  try {
    return db.getAllRecords();
  } catch (e) {
    console.error(e);
    return [];
  }
});

ipcMain.handle('records:add', async (event, record) => {
  try {
    const newRecord = {
      ...record,
      id: record.id || `srv-${Date.now()}`,
      timestamp: record.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    db.addRecord(newRecord);
    return newRecord;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('records:update', async (event, id, fields) => {
  try {
    db.updateRecord(id, fields);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('records:delete', async (event, id) => {
  try {
    db.deleteRecord(id);
    // Background delete from cloud
    firebaseSync.deleteRecordFromCloud(id).catch(console.error);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

// --- MILESTONES ---

ipcMain.handle('milestones:get-all', async () => {
  try {
    return db.getAllMilestones();
  } catch (e) {
    console.error(e);
    return [];
  }
});

ipcMain.handle('milestones:add', async (event, milestone) => {
  try {
    const newMilestone = {
      ...milestone,
      id: milestone.id || `m-${Date.now()}`
    };
    db.addMilestone(newMilestone);
    return newMilestone;
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('milestones:delete', async (event, id) => {
  try {
    db.deleteMilestone(id);
    // Background delete from cloud
    firebaseSync.deleteMilestoneFromCloud(id).catch(console.error);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

// --- SYSTEM ---

ipcMain.handle('system:reset-db', async (event, shouldSeed) => {
  try {
    return db.resetDatabase(shouldSeed);
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('system:get-db-path', async () => {
  try {
    return db.getDbPath();
  } catch (e) {
    return '';
  }
});

// --- CLOUD BACKUP ---

ipcMain.handle('cloud:backup-now', async () => {
  return firebaseSync.syncLocalToCloud();
});

ipcMain.handle('cloud:get-status', async () => {
  try {
    const unsyncedUsers = db.getUnsyncedUsers().length;
    const unsyncedRecords = db.getUnsyncedRecords().length;
    const unsyncedMilestones = db.getUnsyncedMilestones().length;
    const totalUnsynced = unsyncedUsers + unsyncedRecords + unsyncedMilestones;

    return {
      unsyncedCount: totalUnsynced,
      details: {
        users: unsyncedUsers,
        records: unsyncedRecords,
        milestones: unsyncedMilestones
      }
    };
  } catch (e) {
    return { unsyncedCount: 0, error: e.message };
  }
});

ipcMain.handle('cloud:check-internet', async () => {
  return firebaseSync.checkInternet();
});
