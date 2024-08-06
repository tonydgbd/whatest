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
  @Post('/0')
  async sendPayWithOrange() {
    const rowData = {
      title: 'Poulet Panne',
      description: 'panne',
      availability: 'in stock',
      condition: 'new',
      price: '500 XOF',
      link: 'https://www.facebook.com/facebook_t_shirt',
      image_link:
        'https://platetrecette.com/wp-content/uploads/2019/11/cuisses-croustillantes-et-légères-au-four-WW.jpg',
      brand: 'Le Meilleur GOUT',
      google_product_category: 'Apparel & Accessories > Clothing',
      fb_product_category: 'Clothing & Accessories > Clothing',
      quantity_to_sell_on_facebook: '75',
      sale_price: '10,00 USD',
      sale_price_effective_date:
        '2020-04-30T09:30-08:00/2020-05-30T23:59-08:00',
      item_group_id: '445',
      gender: 'unisex',
      color: 'royal blue',
      size: 'M',
      age_group: 'adult',
      material: 'cotton',
      pattern: 'stripes',
      shipping: '',
      shipping_weight: '10 kg',
      'video[0].url': 'http://www.facebook.com/a0.mp4',
      'video[0].tag[0]': 'Gym',
      'address.city': 'Palo Alto',
      'address.country': 'United States',
      'address.neighborhoods': 'Palo Alto',
      'address.postal_code': '12345',
      'address.region': 'California',
      'address.street_address': '675 El Camino Real',
      'availability_polygon_coordinates[0].latitude': '10.4',
      'availability_polygon_coordinates[0].longitude': '87',
      'availability_polygon_coordinates[1].latitude': '88.123',
      'availability_polygon_coordinates[1].longitude': '10.123',
      'availability_polygon_coordinates[2].latitude': '87.123',
      'availability_polygon_coordinates[2].longitude': '11.123',
      'availability_polygon_coordinates[3].latitude': '10.4',
      'availability_polygon_coordinates[3].longitude': '87',
      'availability_circle_origin.latitude': '88.223',
      'availability_circle_origin.longitude': '10.123',
      availability_circle_radius_unit: 'km',
      availability_circle_radius: '4',
      'style[0]': 'Bodycon',
      id: 'SguoLJAXCRJMUS283VL7Qh',
    };
  }
  @Post('/5')
  async sendbuttonimage() {
    await this.directusServiceService.createOrder(
      {
        step: 5,
        data: {
          order: {
            catalog_id: '1772883193117356',
            text: '',
            product_items: [
              {
                product_retailer_id: '1',
                quantity: 1,
                item_price: 500,
                currency: 'XOF',
              },
            ],
          },
          location: { latitude: 12.405309677124, longitude: -1.5781556367874 },
        },
        total: 500,
      },
      '22660356506',
    );
  }
  @Post('/6')
  async uploadimage() {
    await utils.sendImage(
      '22660356506',
      'https://quickchart.io/qr?text=32456789089786&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png',
    );
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
