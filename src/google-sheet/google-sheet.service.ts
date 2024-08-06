import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetService {
  client: any;

  constructor() {
    this.initializeClient();
  }

  async initializeClient() {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
    });
    this.client = await auth.getClient();
  }
  async addRowFromDictionary(
    sheetName: string,
    spreadsheetId: string,
    rowData: { [key: string]: any },
  ) {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.client });

      // Lire les données existantes de la feuille
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A:Z`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('No data found.');
        return;
      }

      // Créer un objet de mappage entre les noms de colonnes et les indices de colonnes
      const headerRow = rows[0];
      const columnMapping: { [key: string]: number } = {};
      headerRow.forEach((header, index) => {
        columnMapping[header] = index;
      });

      // Mapper les valeurs de rowData aux cellules correspondantes
      const newRow = new Array(headerRow.length).fill('');
      for (const [key, value] of Object.entries(rowData)) {
        if (columnMapping[key] !== undefined) {
          newRow[columnMapping[key]] = value;
        }
      }

      // Ajouter une nouvelle ligne
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [newRow],
        },
      });
      console.log('Row added.');
    } catch (error) {
      console.error('Error adding row:', error);
    }
  }
  async updateRowFromDictionary(
    sheetName: string,
    spreadsheetId: string,
    rowData: { [key: string]: any },
    uniqueKey: string,
    uniqueValue: any,
  ) {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.client });

      // Lire les données existantes de la feuille
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A:Z`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('No data found.');
        return;
      }

      // Créer un objet de mappage entre les noms de colonnes et les indices de colonnes
      const headerRow = rows[0];
      const columnMapping: { [key: string]: number } = {};
      headerRow.forEach((header, index) => {
        columnMapping[header] = index;
      });

      // Trouver la ligne à mettre à jour
      const rowIndex = rows.findIndex(
        (row) => row[columnMapping[uniqueKey]] === uniqueValue,
      );
      if (rowIndex === -1) {
        console.log('Row not found.');
        return;
      }

      // Mettre à jour les valeurs de rowData aux cellules correspondantes
      const updatedRow = rows[rowIndex];
      for (const [key, value] of Object.entries(rowData)) {
        if (columnMapping[key] !== undefined) {
          updatedRow[columnMapping[key]] = value;
        }
      }

      // Envoyer les données mises à jour
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A${rowIndex + 1}:Z${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [updatedRow],
        },
      });
      console.log('Row updated.');
    } catch (error) {
      console.error('Error updating row:', error);
    }
  }
  async deleteRowById(
    sheetName: string,
    uniqueKey: string,
    uniqueValue: any,
    spreadsheetId: string,
  ) {
    try {
      const sheets = google.sheets({ version: 'v4', auth: this.client });

      // Lire les données existantes de la feuille
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A:Z`,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log('No data found.');
        return;
      }

      // Créer un objet de mappage entre les noms de colonnes et les indices de colonnes
      const headerRow = rows[0];
      const columnMapping: { [key: string]: number } = {};
      headerRow.forEach((header, index) => {
        columnMapping[header] = index;
      });

      // Trouver la ligne à supprimer
      const rowIndex = rows.findIndex(
        (row) => row[columnMapping[uniqueKey]] === uniqueValue,
      );
      if (rowIndex === -1) {
        console.log('Row not found.');
        return;
      }

      // Supprimer la ligne correspondante
      rows.splice(rowIndex, 1);

      // Envoyer les données mises à jour
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A1:Z`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      });
      console.log('Row deleted.');
    } catch (error) {
      console.error('Error deleting row:', error);
    }
  }
}
