import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';
import * as db from './database.js';
import dns from 'dns';

let app;
let firestore;
let isInitialized = false;

export function initFirebase() {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_")) {
      console.warn("Firebase not configured or invalid credentials in firebase-config.js");
      return false;
    }
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    isInitialized = true;
    console.log("Firebase initialized successfully.");
    return true;
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return false;
  }
}

export function checkInternet() {
  return new Promise((resolve) => {
    dns.lookup('firestore.googleapis.com', (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export async function syncLocalToCloud() {
  if (!isInitialized) {
    const initialized = initFirebase();
    if (!initialized) {
      return { success: false, message: "Firebase no está configurado." };
    }
  }

  const hasInternet = await checkInternet();
  if (!hasInternet) {
    return { success: false, message: "Sin conexión a internet." };
  }

  try {
    let usersSynced = 0;
    let recordsSynced = 0;
    let milestonesSynced = 0;

    // 1. Sync users
    const unsyncedUsers = db.getUnsyncedUsers();
    for (const user of unsyncedUsers) {
      // Exclude passwords salt & hash from cloud for security
      const cloudUserData = {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        personnelId: user.personnelId,
        role: user.role,
        bloodType: user.bloodType,
        photoBase64: user.photoBase64 || null,
        createdAt: user.createdAt
      };

      const userDocRef = doc(firestore, 'users', user.username);
      await setDoc(userDocRef, cloudUserData, { merge: true });
      db.markUserSynced(user.username);
      usersSynced++;
    }

    // 2. Sync records
    const unsyncedRecords = db.getUnsyncedRecords();
    for (const record of unsyncedRecords) {
      const recordDocRef = doc(firestore, 'records', record.id);
      
      // Clean up local fields for firestore compatibility
      const { synced, createdAt, ...cloudRecordData } = record;
      await setDoc(recordDocRef, cloudRecordData, { merge: true });
      db.markRecordSynced(record.id);
      recordsSynced++;
    }

    // 3. Sync milestones
    const unsyncedMilestones = db.getUnsyncedMilestones();
    for (const milestone of unsyncedMilestones) {
      const milestoneDocRef = doc(firestore, 'milestones', milestone.id);
      
      const { synced, createdAt, ...cloudMilestoneData } = milestone;
      await setDoc(milestoneDocRef, cloudMilestoneData, { merge: true });
      db.markMilestoneSynced(milestone.id);
      milestonesSynced++;
    }

    return {
      success: true,
      usersSynced,
      recordsSynced,
      milestonesSynced,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error running Firebase sync:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteRecordFromCloud(id) {
  if (!isInitialized) return;
  const hasInternet = await checkInternet();
  if (!hasInternet) return; // Silent skip if no internet, it won't be on Firestore anyway if we sync local records as the source of truth

  try {
    const recordDocRef = doc(firestore, 'records', id);
    await deleteDoc(recordDocRef);
    console.log(`Record ${id} deleted from Firestore.`);
  } catch (error) {
    console.error(`Failed to delete record ${id} from Firestore:`, error);
  }
}

export async function deleteMilestoneFromCloud(id) {
  if (!isInitialized) return;
  const hasInternet = await checkInternet();
  if (!hasInternet) return;

  try {
    const milestoneDocRef = doc(firestore, 'milestones', id);
    await deleteDoc(milestoneDocRef);
    console.log(`Milestone ${id} deleted from Firestore.`);
  } catch (error) {
    console.error(`Failed to delete milestone ${id} from Firestore:`, error);
  }
}
