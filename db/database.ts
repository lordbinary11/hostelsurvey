import * as SQLite from 'expo-sqlite';
import { Survey } from '../types/survey';

const dbName = 'hostelsurvey.db';

type AsyncDB = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, params?: any[]) => Promise<any>;
  getAllAsync: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  getFirstAsync: <T = any>(sql: string, params?: any[]) => Promise<T | null>;
};

let mode: 'async' | 'web' | null = null;
let asyncDb: AsyncDB | null = null;
let webDb: any = null;

const detectAndGetDb = async (): Promise<AsyncDB> => {
  if (mode === 'async' && asyncDb) return asyncDb;
  if (mode === 'web' && webDb) return webWrap(webDb);

  // Try async API first
  try {
    const db = await (SQLite as any).openDatabaseAsync(dbName);
    // quick smoke test for prepareAsync availability by calling a safe method
    if (typeof db.prepareAsync === 'function') {
      mode = 'async';
      asyncDb = db as AsyncDB;
      return asyncDb;
    }
  } catch (e) {
    // fallthrough to web
  }

  // Fallback to web (WebSQL) style API available in Expo Go
  try {
    const wdb = (SQLite as any).openDatabase(dbName);
    webDb = wdb;
    mode = 'web';
    return webWrap(webDb);
  } catch (err) {
    throw new Error('No suitable SQLite implementation available: ' + String(err));
  }
};

const webWrap = (db: any): AsyncDB => {
  return {
    execAsync: (sql: string) =>
      new Promise<void>((resolve, reject) => {
        db.transaction((tx: any) => {
          tx.executeSql(sql, [], () => resolve(), (_: any, error: any) => reject(error));
        }, (err: any) => reject(err));
      }),
    runAsync: (sql: string, params: any[] = []) =>
      new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
          tx.executeSql(sql, params, (_tx: any, result: any) => resolve({ lastInsertRowId: result.insertId ?? result.rowsAffected ?? 0, changes: result.rowsAffected ?? 0 }), (_tx: any, error: any) => reject(error));
        }, (err: any) => reject(err));
      }),
    getAllAsync: <T = any>(sql: string) =>
      new Promise<T[]>((resolve, reject) => {
        db.transaction((tx: any) => {
          tx.executeSql(sql, [], (_tx: any, result: any) => resolve(result.rows._array || []), (_tx: any, error: any) => reject(error));
        }, (err: any) => reject(err));
      }),
    getFirstAsync: <T = any>(sql: string, params: any[] = []) =>
      new Promise<T | null>((resolve, reject) => {
        db.transaction((tx: any) => {
          tx.executeSql(sql, params, (_tx: any, result: any) => {
            const arr = result.rows._array || [];
            resolve(arr.length ? arr[0] : null);
          }, (_tx: any, error: any) => reject(error));
        }, (err: any) => reject(err));
      }),
  };
};

export const initDatabase = async (): Promise<void> => {
  const db = await detectAndGetDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hostelName TEXT NOT NULL,
      photoPath TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      numberOfFloors INTEGER NOT NULL,
      numberOfRooms INTEGER NOT NULL,
      numberOfResidents INTEGER NOT NULL,
      managerName TEXT NOT NULL,
      managerPhone TEXT NOT NULL,
      hasWifi INTEGER NOT NULL,
      completionStatus TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);
};

export const insertSurvey = async (survey: Survey): Promise<number> => {
  const db = await detectAndGetDb();
  const res: any = await db.runAsync(
    `INSERT INTO surveys (
      hostelName, photoPath, date, time, latitude, longitude,
      numberOfFloors, numberOfRooms, numberOfResidents,
      managerName, managerPhone, hasWifi, completionStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      survey.hostelName,
      survey.photoPath,
      survey.date,
      survey.time,
      survey.latitude,
      survey.longitude,
      survey.numberOfFloors,
      survey.numberOfRooms,
      survey.numberOfResidents,
      survey.managerName,
      survey.managerPhone,
      survey.hasWifi ? 1 : 0,
      survey.completionStatus,
    ]
  );

  return (res && (res.lastInsertRowId ?? res.insertId)) || 0;
};

export const getAllSurveys = async (): Promise<Survey[]> => {
  const db = await detectAndGetDb();
  const rows = await db.getAllAsync<any>(`SELECT * FROM surveys ORDER BY createdAt DESC`);

  return rows.map((row: any) => ({
    ...row,
    id: row.id,
    hasWifi: row.hasWifi === 1,
    createdAt: row.createdAt,
  }));
};

export const deleteSurvey = async (id: number): Promise<void> => {
  const db = await detectAndGetDb();
  await db.runAsync(`DELETE FROM surveys WHERE id = ?`, [id]);
};

export const getSurveyById = async (id: number): Promise<Survey | null> => {
  const db = await detectAndGetDb();
  const result = await db.getFirstAsync<any>(`SELECT * FROM surveys WHERE id = ?`, [id]);
  if (!result) return null;
  return {
    ...result,
    hasWifi: (result as any).hasWifi === 1,
  };
};

export const clearAllSurveys = async (): Promise<void> => {
  const db = await detectAndGetDb();
  await db.runAsync(`DELETE FROM surveys`);
};

