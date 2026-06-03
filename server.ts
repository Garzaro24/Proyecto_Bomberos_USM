import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import { ServiceRecord, HumanMilestone } from './src/types';

const app = express();
const PORT = 3000;
app.use(express.json({ limit: '10mb' }));

// Paths
const DB_DIR = path.join(process.cwd(), 'database');
const RECORDS_FILE = path.join(DB_DIR, 'records.json');
const MILESTONES_FILE = path.join(DB_DIR, 'milestones.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');

interface UserItem {
  username: string;
  name: string;
  personnelId: string;
  role: string;
  salt: string;
  hash: string;
  bloodType: string;
  firstName?: string;
  lastName?: string;
  photoBase64?: string;
}

const hashPassword = (password: string, salt?: string) => {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, finalSalt, 1000, 64, 'sha512').toString('hex');
  return { salt: finalSalt, hash };
};

const getUsers = (): UserItem[] => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const { salt, hash } = hashPassword('password123');
      const defaultUsers: UserItem[] = [
        {
          username: 'admin',
          name: 'Jonathan Hayes',
          personnelId: 'UFD-8821',
          role: 'Teniente',
          salt,
          hash,
          bloodType: 'O+'
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
      return defaultUsers;
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveUsers = (users: UserItem[]) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
};

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Generate realistic mock data to seed database
const seedInitialData = () => {
  const serviceTypes = [
    "Acto de presencia en persona sin signos vitales",
    "Administración de medicamentos",
    "Alarma infundada",
    "Apoyo en Guardia de Prevención",
    "Atención Pre-Hospitalaria",
    "Derrame de Combustible",
    "Diligencias del Servicio",
    "Estabilización de paciente",
    "Guardia de Prevención",
    "Hecho Vial tipo arrollamiento",
    "Hecho Vial tipo Colisión",
    "Hecho Vial tipo volcamiento",
    "Incendio De Vehículo",
    "Incendio Forestales / Vegetación",
    "Inspección de Árbol",
    "Inspección de Riesgo",
    "Inspección de Seguridad",
    "Mitigación De Riesgo",
    "Quema De Basura",
    "Recarga de extintores",
    "Recorridos Preventivos",
    "Relevo de personal",
    "Rescate Animal",
    "Reubicación de avispas",
    "Servicio de cura",
    "Servicio de Nebulización",
    "Servicio de Tensión Arterial",
    "Servicios De Ambulancia Traslado Extra Urbano",
    "Tala O Poda De Árbol",
    "Traslado de emergencia",
    "Traslado Regular",
    "Visita hospitalaria"
  ];

  const firstNames = ['Jonathan', 'Lucas', 'Robert', 'Emily', 'Daniel', 'Maria', 'Sandro', 'Gabriel', 'Carlos', 'Ana'];
  const lastNames = ['Hayes', 'Smith', 'Taylor', 'Brown', 'Martinez', 'Evans', 'Rodríguez', 'Gómez', 'Reynolds', 'Méndez'];
  const pIds = ['UFD-8821', 'UFD-8492', 'UFD-9011', 'UFD-1244', 'UFD-4521'];

  const records: ServiceRecord[] = [];
  const now = new Date();

  // Create exactly 248 records
  for (let i = 0; i < 248; i++) {
    const daysOffset = Math.floor(Math.random() * 60); // Over last 60 days
    const date = new Date(now.getTime() - daysOffset * 24 * 60 * 60 * 1000);
    
    // Pick random service type uniformly
    const selectedType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];

    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const pId = pIds[Math.floor(Math.random() * pIds.length)];

    let statusItem: 'Completed' | 'Active' | 'Pending Review' = 'Completed';
    if (i === 1) {
      statusItem = 'Active'; // Make sure there's at least one active for visual parity
    } else if (i === 3) {
      statusItem = 'Pending Review';
    } else if (Math.random() < 0.04) {
      statusItem = 'Pending Review';
    }

    const timestampStr = date.toISOString().replace('T', ' ').substring(0, 19);

    records.push({
      id: `srv-${100000 + i}`,
      firstName: first,
      lastName: last,
      personnelId: pId,
      serviceDate: date.toISOString().substring(0, 10),
      serviceType: selectedType,
      summary: `Atención de incidente tipo ${selectedType} en el sector centro. Operación ejecutada de manera segura por la unidad de respuesta. Operaciones completadas exitosamente.`,
      status: statusItem,
      timestamp: timestampStr
    });
  }

  // Sort by timestamp descending
  records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf-8');

  // Initial milestones for Jonathan Hayes (UFD-8821)
  const milestones: HumanMilestone[] = [
    {
      id: "m-1",
      personnelId: "UFD-8821",
      type: "Promotion",
      title: "Ascendido a Teniente (Lieutenant)",
      description: "Transferido a la Escuadra de Rescate 3 como oficial al mando para el Turno A.",
      date: "2021-10-12"
    },
    {
      id: "m-2",
      personnelId: "UFD-8821",
      type: "Certification",
      title: "Operaciones Avanzadas de Materiales Peligrosos (HazMat)",
      description: "Completó riguroso curso estatal de certificación de 80 horas para contención de materiales altamente peligrosos.",
      date: "2019-03-05"
    },
    {
      id: "m-3",
      personnelId: "UFD-8821",
      type: "Commendation",
      title: "Citación de Unidad por Valor",
      description: "Otorgado por acciones durante el incendio del complejo industrial de la Calle 4. La Compañía de Motores 4 evacuó con éxito a 12 trabajadores atrapados.",
      date: "2016-08-22"
    },
    {
      id: "m-4",
      personnelId: "UFD-8821",
      type: "Onboarding",
      title: "Graduación de la Academia",
      description: "Juramentado como Bombero I. Asignación inicial a la Compañía de Motores 7.",
      date: "2010-01-10"
    }
  ];

  fs.writeFileSync(MILESTONES_FILE, JSON.stringify(milestones, null, 2), 'utf-8');
};

// Seed databases if they don't exist
if (!fs.existsSync(RECORDS_FILE) || !fs.existsSync(MILESTONES_FILE)) {
  seedInitialData();
}

// Helpers
const getRecords = (): ServiceRecord[] => {
  try {
    const data = fs.readFileSync(RECORDS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveRecords = (records: ServiceRecord[]) => {
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf-8');
};

const getMilestones = (): HumanMilestone[] => {
  try {
    const data = fs.readFileSync(MILESTONES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveMilestones = (milestones: HumanMilestone[]) => {
  fs.writeFileSync(MILESTONES_FILE, JSON.stringify(milestones, null, 2), 'utf-8');
};

// ============================================================================
// AUTHENTICATION ENDPOINTS (WITH SECURE INJECTION AND MALWARE FILTERING)
// ============================================================================

// A. Register account
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, name, personnelId, role, bloodType, firstName, lastName } = req.body;
    if (!username || !password || !name || !personnelId || !bloodType || !firstName || !lastName) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // 1. Username constraints: max 10, lowercase, alphanumeric or dashboard/underscore
    const cleanUsername = String(username).trim().toLowerCase();
    if (!/^[a-z0-9_-]{1,10}$/.test(cleanUsername)) {
      return res.status(400).json({ 
        error: 'El nombre de usuario debe tener máximo 10 caracteres y contener solo letras minúsculas, números, guiones o guiones bajos.' 
      });
    }

    // 2. Password constraints: length 6-10, min 1 uppercase, 1 number, 1 special char
    const cleanPassword = String(password);
    if (cleanPassword.length < 6 || cleanPassword.length > 10) {
      return res.status(400).json({ error: 'La contraseña debe tener entre 6 y 10 caracteres.' });
    }
    if (!/[A-Z]/.test(cleanPassword) || !/\d/.test(cleanPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(cleanPassword)) {
      return res.status(400).json({ 
        error: 'La contraseña debe incluir obligatoriamente al menos una mayúscula, un número y un carácter especial.' 
      });
    }

    // 3. Name constraints: only letters, no numbers/specials, converted to uppercase by client, max length 41 (20 for first, 20 for last + space)
    const cleanFirstName = String(firstName).trim().toUpperCase();
    const cleanLastName = String(lastName).trim().toUpperCase();

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(cleanFirstName)) {
      return res.status(400).json({ 
        error: 'El Nombre es obligatorio, de máximo 20 caracteres, y no puede contener números o caracteres especiales.' 
      });
    }

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(cleanLastName)) {
      return res.status(400).json({ 
        error: 'El Apellido es obligatorio, de máximo 20 caracteres, y no puede contener números o caracteres especiales.' 
      });
    }

    const cleanName = `${cleanFirstName} ${cleanLastName}`;

    // 4. Cédula constraints: unique, only VE-numbers, maximum 10 digits
    const cleanPersonnelId = String(personnelId).trim().toUpperCase();
    if (!/^[VE]-\d{1,10}$/.test(cleanPersonnelId)) {
      return res.status(400).json({ 
        error: 'La Cédula de Identidad debe comenzar con V o E, seguida por un guión y un número entero de máximo 10 dígitos.' 
      });
    }

    // 5. Blood type validation
    const cleanBloodType = String(bloodType).trim().toUpperCase();
    const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (!validBloodTypes.includes(cleanBloodType)) {
      return res.status(400).json({ error: 'El tipo de sangre elegido no es válido.' });
    }

    // Fetch existing users to verify uniqueness
    const users = getUsers();

    // Check username uniqueness
    if (users.some(u => u.username === cleanUsername)) {
      return res.status(400).json({ error: 'El nombre de usuario ya se encuentra registrado.' });
    }

    // Check Cédula (personnelId) uniqueness
    if (users.some(u => u.personnelId === cleanPersonnelId)) {
      return res.status(400).json({ error: 'La Cédula de Identidad ya se encuentra registrada por otro personal.' });
    }

    // 6. Role validation
    const cleanRole = role ? String(role).trim() : 'Bombero';
    const validRoles = ['Bombero', 'Paramedico', 'Sargento', 'Teniente'];
    if (!validRoles.includes(cleanRole)) {
      return res.status(400).json({ error: 'El Rango de Despliegue elegido no es válido.' });
    }

    // Secure, salted password hash
    const { salt, hash } = hashPassword(cleanPassword);
    const newUser: UserItem = {
      username: cleanUsername,
      name: cleanName,
      personnelId: cleanPersonnelId,
      role: cleanRole,
      salt,
      hash,
      bloodType: cleanBloodType,
      firstName: cleanFirstName,
      lastName: cleanLastName
    };

    users.push(newUser);
    saveUsers(users);

    const profile = {
      username: newUser.username,
      name: newUser.name,
      personnelId: newUser.personnelId,
      role: newUser.role,
      bloodType: newUser.bloodType,
      firstName: newUser.firstName,
      lastName: newUser.lastName
    };

    res.status(201).json(profile);
  } catch (err: any) {
    res.status(500).json({ error: 'Error del servidor al registrar el usuario: ' + err.message });
  }
});

// B. Login account
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Por favor complete todos los campos.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password);

    const users = getUsers();
    const user = users.find(u => u.username === cleanUsername);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas. Usuario no registrado o clave incorrecta.' });
    }

    const { hash } = hashPassword(cleanPassword, user.salt);
    if (hash !== user.hash) {
      return res.status(401).json({ error: 'Credenciales inválidas. Usuario no registrado o clave incorrecta.' });
    }

    // To prevent splitting bugs: if user stored without firstName/lastName, we safe-fallback
    const userFirstName = user.firstName || user.name.split(' ')[0] || '';
    const userLastName = user.lastName || user.name.split(' ').slice(1).join(' ') || '';

    res.json({
      username: user.username,
      name: user.name,
      personnelId: user.personnelId,
      role: user.role,
      bloodType: user.bloodType || 'No especificado',
      firstName: userFirstName,
      lastName: userLastName,
      photoBase64: user.photoBase64
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error interno en el servidor al autenticar: ' + err.message });
  }
});

// C. Update profile with security validations & uniqueness check for Cédula de Identidad
app.post('/api/auth/update-profile', (req, res) => {
  try {
    const { username, firstName, lastName, personnelId, bloodType, photoBase64 } = req.body;
    if (!username || !firstName || !lastName || !personnelId || !bloodType) {
      return res.status(400).json({ error: 'Todos los campos obligatorios (*) deben completarse.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanFirstName = String(firstName).trim().toUpperCase();
    const cleanLastName = String(lastName).trim().toUpperCase();
    const cleanPersonnelId = String(personnelId).trim().toUpperCase();
    const cleanBloodType = String(bloodType).trim().toUpperCase();

    // Standard letters-only validation pattern matching register constraints
    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(cleanFirstName)) {
      return res.status(400).json({ 
        error: 'El Nombre es obligatorio, de máximo 20 caracteres, y no puede contener números o caracteres especiales.' 
      });
    }

    if (!/^[A-ZÁÉÍÓÚÜÑ\s]{1,20}$/.test(cleanLastName)) {
      return res.status(400).json({ 
        error: 'El Apellido es obligatorio, de máximo 20 caracteres, y no puede contener números o caracteres especiales.' 
      });
    }

    // Checking if personnelId matches format [VE]-\d{1,10}
    if (!/^[VE]-\d{1,10}$/.test(cleanPersonnelId)) {
      return res.status(400).json({ 
        error: 'La Cédula de Identidad debe comenzar con V o E, seguida por un guión y un número entero de máximo 10 dígitos.' 
      });
    }

    const validBloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (!validBloodTypes.includes(cleanBloodType)) {
      return res.status(400).json({ error: 'El tipo de sangre elegido no es válido.' });
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.username === cleanUsername);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Oficial de bomberos no registrado en el sistema.' });
    }

    // 1- VERIFY CEDULA UNIQUENESS (Does any other user have the same personnelId?)
    const alreadyExists = users.some((u, idx) => idx !== userIndex && u.personnelId === cleanPersonnelId);
    if (alreadyExists) {
      return res.status(400).json({ 
        error: 'La Cédula de Identidad ingresada ya pertenece a otro oficial registrado en el sistema.' 
      });
    }

    // Update fields
    const updatedUserObj: UserItem = {
      ...users[userIndex],
      firstName: cleanFirstName,
      lastName: cleanLastName,
      name: `${cleanFirstName} ${cleanLastName}`,
      personnelId: cleanPersonnelId,
      bloodType: cleanBloodType
    };

    if (photoBase64 !== undefined) {
      updatedUserObj.photoBase64 = photoBase64;
    }

    users[userIndex] = updatedUserObj;
    saveUsers(users);

    res.json({
      username: updatedUserObj.username,
      name: updatedUserObj.name,
      personnelId: updatedUserObj.personnelId,
      role: updatedUserObj.role,
      bloodType: updatedUserObj.bloodType,
      firstName: updatedUserObj.firstName,
      lastName: updatedUserObj.lastName,
      photoBase64: updatedUserObj.photoBase64
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error interno en el servidor al actualizar credenciales: ' + err.message });
  }
});

// API REGISTRATION
// 1. Get all records
app.get('/api/records', (req, res) => {
  res.json(getRecords());
});

// 2. Add single record
app.post('/api/records', (req, res) => {
  const records = getRecords();
  const newRecord: ServiceRecord = {
    ...req.body,
    id: req.body.id || `srv-${Date.now()}`,
    timestamp: req.body.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  records.unshift(newRecord);
  saveRecords(records);
  res.status(201).json(newRecord);
});

// 3. Sync bulk records (Offline-First sync endpoint)
app.post('/api/records/bulk', (req, res) => {
  const incomingRecords: ServiceRecord[] = req.body;
  const currentRecords = getRecords();

  let addedCount = 0;
  let updatedCount = 0;

  incomingRecords.forEach((incoming) => {
    const existingIndex = currentRecords.findIndex(r => r.id === incoming.id);
    if (existingIndex !== -1) {
      // Overwrite/update if needed
      currentRecords[existingIndex] = {
        ...currentRecords[existingIndex],
        ...incoming,
        synced: true // Strip synced status indicator for DB saving
      };
      delete currentRecords[existingIndex].synced;
      updatedCount++;
    } else {
      const recordToAdd = { ...incoming };
      delete recordToAdd.synced;
      currentRecords.unshift(recordToAdd);
      addedCount++;
    }
  });

  // Re-sort descending
  currentRecords.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  saveRecords(currentRecords);

  res.json({
    status: 'success',
    added: addedCount,
    updated: updatedCount,
    totalCount: currentRecords.length
  });
});

// 4. Update existing record
app.put('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const records = getRecords();
  const index = records.findIndex(r => r.id === id);

  if (index !== -1) {
    records[index] = {
      ...records[index],
      ...req.body,
      id // preserve ID
    };
    saveRecords(records);
    res.json(records[index]);
  } else {
    res.status(404).json({ error: 'Record not found' });
  }
});

// 5. Delete record
app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  let records = getRecords();
  const initialLength = records.length;
  records = records.filter(r => r.id !== id);

  if (records.length < initialLength) {
    saveRecords(records);
    res.json({ success: true, message: `Deleted ${id}` });
  } else {
    res.status(404).json({ error: 'Record not found' });
  }
});

// 6. Get Milestones
app.get('/api/milestones', (req, res) => {
  res.json(getMilestones());
});

// 7. Add Milestone
app.post('/api/milestones', (req, res) => {
  const milestones = getMilestones();
  const newMilestone: HumanMilestone = {
    ...req.body,
    id: `m-${Date.now()}`
  };
  milestones.unshift(newMilestone);
  saveMilestones(milestones);
  res.status(201).json(newMilestone);
});

// 8. Delete Milestone
app.delete('/api/milestones/:id', (req, res) => {
  const { id } = req.params;
  let milestones = getMilestones();
  milestones = milestones.filter(m => m.id !== id);
  saveMilestones(milestones);
  res.json({ success: true });
});

// 9. Force reset and reseed database
app.post('/api/reset', (req, res) => {
  seedInitialData();
  res.json({
    success: true,
    records: getRecords().length,
    milestones: getMilestones().length
  });
});

// Vite server integrations
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    // Mount Vite middlewares
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
