import { app } from 'electron';
import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

let db;
let dbPath;

export function hashPassword(password, salt) {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, finalSalt, 1000, 64, 'sha512').toString('hex');
  return { salt: finalSalt, hash };
}

function saveDatabase() {
  if (db && dbPath) {
    const binaryArray = db.export();
    const buffer = Buffer.from(binaryArray);
    fs.writeFileSync(dbPath, buffer);
  }
}

export async function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbPath = path.join(dbDir, 'bomberos.db');
  console.log('Database path:', dbPath);

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Existing database loaded.');
  } else {
    db = new SQL.Database();
    console.log('New database initialized.');
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      name TEXT NOT NULL,
      personnelId TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'Bombero',
      salt TEXT NOT NULL,
      hash TEXT NOT NULL,
      bloodType TEXT NOT NULL,
      photoBase64 TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      personnelId TEXT NOT NULL,
      serviceDate TEXT NOT NULL,
      serviceType TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Completed',
      timestamp TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      personnelId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0
    );
  `);
  // Force re-sync of all users to Firestore to upload credentials
  db.run('UPDATE users SET synced = 0');
  saveDatabase();

  // Migrate or create the canonical 'admin' user with secure credentials
  const adminStmt = db.prepare("SELECT username FROM users WHERE username = 'admin'");
  const adminExists = adminStmt.step();
  adminStmt.free();

  if (adminExists) {
    // Migrate existing admin: update password and role
    const { salt, hash } = hashPassword('Admin2026.');
    const updateStmt = db.prepare(`
      UPDATE users SET salt = ?, hash = ?, role = 'Administrador', synced = 0
      WHERE username = 'admin'
    `);
    updateStmt.run([salt, hash]);
    updateStmt.free();
    saveDatabase();
    console.log('Admin user migrated: password and role updated.');
  } else {
    // Create admin from scratch (new database)
    const { salt, hash } = hashPassword('Admin2026.');
    const insertStmt = db.prepare(`
      INSERT INTO users (username, firstName, lastName, name, personnelId, role, salt, hash, bloodType, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
    insertStmt.run(['admin', 'Administrador', 'Sistema', 'Administrador Sistema', 'ADM-0001', 'Administrador', salt, hash, 'O+']);
    insertStmt.free();
    saveDatabase();
    console.log('Admin user created with secure credentials.');
  }

  return dbPath;
}

export function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'database', 'bomberos.db');
}

// ==================== USERS ====================

export function getUserByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  stmt.bind([username]);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

export function getUserByPersonnelId(personnelId) {
  const stmt = db.prepare('SELECT * FROM users WHERE personnelId = ?');
  stmt.bind([personnelId]);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

export function registerUser(userData) {
  const { username, firstName, lastName, name, personnelId, role, salt, hash, bloodType } = userData;
  const stmt = db.prepare(`
    INSERT INTO users (username, firstName, lastName, name, personnelId, role, salt, hash, bloodType, synced)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);
  stmt.run([username, firstName, lastName, name, personnelId, role, salt, hash, bloodType]);
  stmt.free();
  saveDatabase();
}

export function updateProfile(username, data) {
  const { firstName, lastName, name, personnelId, bloodType, photoBase64 } = data;
  if (photoBase64 !== undefined) {
    const stmt = db.prepare(`
      UPDATE users 
      SET firstName = ?, lastName = ?, name = ?, personnelId = ?, bloodType = ?, photoBase64 = ?, synced = 0
      WHERE username = ?
    `);
    stmt.run([firstName, lastName, name, personnelId, bloodType, photoBase64, username]);
    stmt.free();
  } else {
    const stmt = db.prepare(`
      UPDATE users 
      SET firstName = ?, lastName = ?, name = ?, personnelId = ?, bloodType = ?, synced = 0
      WHERE username = ?
    `);
    stmt.run([firstName, lastName, name, personnelId, bloodType, username]);
    stmt.free();
  }
  saveDatabase();
}

export function getAllUsers() {
  const stmt = db.prepare('SELECT * FROM users');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function getUnsyncedUsers() {
  const stmt = db.prepare('SELECT * FROM users WHERE synced = 0');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function markUserSynced(username) {
  const stmt = db.prepare('UPDATE users SET synced = 1 WHERE username = ?');
  stmt.run([username]);
  stmt.free();
  saveDatabase();
}

// ==================== RECORDS ====================

export function getAllRecords() {
  const stmt = db.prepare('SELECT * FROM records ORDER BY timestamp DESC');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function addRecord(record) {
  const { id, firstName, lastName, personnelId, serviceDate, serviceType, summary, status, timestamp } = record;
  const stmt = db.prepare(`
    INSERT INTO records (id, firstName, lastName, personnelId, serviceDate, serviceType, summary, status, timestamp, synced)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);
  stmt.run([id, firstName, lastName, personnelId, serviceDate, serviceType, summary, status, timestamp]);
  stmt.free();
  saveDatabase();
}

export function updateRecord(id, record) {
  const fields = Object.keys(record).filter(k => k !== 'id' && k !== 'createdAt' && k !== 'synced');
  if (fields.length === 0) return;

  const setClause = fields.map(field => `${field} = ?`).join(', ') + ', synced = 0';
  const values = fields.map(field => record[field]);
  values.push(id);

  const stmt = db.prepare(`UPDATE records SET ${setClause} WHERE id = ?`);
  stmt.run(values);
  stmt.free();
  saveDatabase();
}

export function deleteRecord(id) {
  const stmt = db.prepare('DELETE FROM records WHERE id = ?');
  stmt.run([id]);
  stmt.free();
  saveDatabase();
}

export function getUnsyncedRecords() {
  const stmt = db.prepare('SELECT * FROM records WHERE synced = 0');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function markRecordSynced(id) {
  const stmt = db.prepare('UPDATE records SET synced = 1 WHERE id = ?');
  stmt.run([id]);
  stmt.free();
  saveDatabase();
}

// ==================== MILESTONES ====================

export function getAllMilestones() {
  const stmt = db.prepare('SELECT * FROM milestones ORDER BY date DESC');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function addMilestone(milestone) {
  const { id, personnelId, type, title, description, date } = milestone;
  const stmt = db.prepare(`
    INSERT INTO milestones (id, personnelId, type, title, description, date, synced)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `);
  stmt.run([id, personnelId, type, title, description, date]);
  stmt.free();
  saveDatabase();
}

export function deleteMilestone(id) {
  const stmt = db.prepare('DELETE FROM milestones WHERE id = ?');
  stmt.run([id]);
  stmt.free();
  saveDatabase();
}

export function getUnsyncedMilestones() {
  const stmt = db.prepare('SELECT * FROM milestones WHERE synced = 0');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function markMilestoneSynced(id) {
  const stmt = db.prepare('UPDATE milestones SET synced = 1 WHERE id = ?');
  stmt.run([id]);
  stmt.free();
  saveDatabase();
}

// ==================== SYSTEM ====================

export function resetDatabase(shouldSeed = true) {
  db.run('DELETE FROM records');
  db.run('DELETE FROM milestones');
  // Re-seed mock data only if shouldSeed is true
  if (shouldSeed) {
    seedInitialData();
  }
  saveDatabase();

  const recCountStmt = db.prepare('SELECT COUNT(*) as count FROM records');
  recCountStmt.step();
  const recordsCount = recCountStmt.getAsObject().count;
  recCountStmt.free();

  const milCountStmt = db.prepare('SELECT COUNT(*) as count FROM milestones');
  milCountStmt.step();
  const milestonesCount = milCountStmt.getAsObject().count;
  milCountStmt.free();

  return {
    records: recordsCount,
    milestones: milestonesCount
  };
}

function seedInitialData() {
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

  const now = new Date();
  
  // Create exactly 248 records
  const insertRec = db.prepare(`
    INSERT INTO records (id, firstName, lastName, personnelId, serviceDate, serviceType, summary, status, timestamp, synced)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);

  for (let i = 0; i < 248; i++) {
    const daysOffset = Math.floor(Math.random() * 60); // Over last 60 days
    const date = new Date(now.getTime() - daysOffset * 24 * 60 * 60 * 1000);
    
    const selectedType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const pId = pIds[Math.floor(Math.random() * pIds.length)];

    let statusItem = 'Completed';
    if (i === 1) {
      statusItem = 'Active';
    } else if (i === 3) {
      statusItem = 'Pending Review';
    } else if (Math.random() < 0.04) {
      statusItem = 'Pending Review';
    }

    const timestampStr = date.toISOString().replace('T', ' ').substring(0, 19);

    insertRec.run([
      `srv-${100000 + i}`,
      first,
      last,
      pId,
      date.toISOString().substring(0, 10),
      selectedType,
      `Atención de incidente tipo ${selectedType} en el sector centro. Operación ejecutada de manera segura por la unidad de respuesta. Operaciones completadas exitosamente.`,
      statusItem,
      timestampStr
    ]);
  }
  insertRec.free();

  // Initial milestones for Jonathan Hayes (UFD-8821)
  const milestones = [
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

  const insertMilestone = db.prepare(`
    INSERT INTO milestones (id, personnelId, type, title, description, date, synced)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `);
  for (const m of milestones) {
    insertMilestone.run([m.id, m.personnelId, m.type, m.title, m.description, m.date]);
  }
  insertMilestone.free();
}
