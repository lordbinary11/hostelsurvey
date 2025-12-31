import * as SQLite from 'expo-sqlite';
import { Survey } from '../types/survey';

const dbName = 'hostelsurvey.db';

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  return await SQLite.openDatabaseAsync(dbName);
};

export const initDatabase = async (): Promise<void> => {
  const db = await getDatabase();
  
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
    );
  `);
};

export const insertSurvey = async (survey: Survey): Promise<number> => {
  const db = await getDatabase();
  
  const result = await db.runAsync(
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
  
  return result.lastInsertRowId;
};

export const getAllSurveys = async (): Promise<Survey[]> => {
  const db = await getDatabase();
  
  const result = await db.getAllAsync<Survey>(
    `SELECT * FROM surveys ORDER BY createdAt DESC`
  );
  
  return result.map((row: any) => ({
    ...row,
    id: row.id,
    hasWifi: row.hasWifi === 1,
    createdAt: row.createdAt,
  }));
};

export const deleteSurvey = async (id: number): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(`DELETE FROM surveys WHERE id = ?`, [id]);
};

export const getSurveyById = async (id: number): Promise<Survey | null> => {
  const db = await getDatabase();
  
  const result = await db.getFirstAsync<Survey>(
    `SELECT * FROM surveys WHERE id = ?`,
    [id]
  );
  
  if (!result) return null;
  
  return {
    ...result,
    hasWifi: (result as any).hasWifi === 1,
  };
};

export const clearAllSurveys = async (): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(`DELETE FROM surveys`);
};

