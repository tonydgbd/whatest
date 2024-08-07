import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';
import utils from './utils';
import { GoogleSheetService } from './google-sheet/google-sheet.service';
import { DirectusServiceService } from './directus-service/directus-service.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private googleSheetService: GoogleSheetService,
    private directusServiceService: DirectusServiceService,
  ) {
    this.googleSheetService = new GoogleSheetService();
  }

  @Post('/messages')
  getMessages(req: Request) {
    console.log(req.body);
  }
  @Post('/1')
  getit(@Body() data: any) {
    console.log(data);
    return;
  }
  @Post('/0')
  async sendPayWithOrange() {
   
  }
  @Post('/delete-row')
  async deleteRow(
    @Body() body: { sheetName: string; id: string; spreadsheetId: string },
  ) {
    const { sheetName, id, spreadsheetId } = body;
    await this.googleSheetService.deleteRowById(
      sheetName,
      'id',
      id,
      spreadsheetId,
    );
    return { message: 'Row deleted successfully' };
  }

  @Post('/update-row')
  async updateRow(
    @Body()
    body: {
      sheetName: string;
      rowData: any;
      id: string;

      spreadsheetId: string;
    },
  ) {
    const { sheetName, rowData, id, spreadsheetId } = body;
    await this.googleSheetService.updateRowFromDictionary(
      sheetName,
      spreadsheetId,
      rowData,
      'id',
      id,
    );
    return { message: 'Row updated successfully' };
  }
  @Post('/add-row')
  async addRow(
    @Body() body: { sheetName: string; rowData: any; spreadsheetId: string },
  ) {
    const { sheetName, spreadsheetId, rowData } = body;
    await this.googleSheetService.addRowFromDictionary(
      sheetName,
      spreadsheetId,
      rowData,
    );
    return { message: 'Row added successfully' };
  }
}
