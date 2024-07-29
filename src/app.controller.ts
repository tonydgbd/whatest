import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';
import utils from './utils';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  @Post('/messages')
  getMessages(req: Request) {
    console.log(req.body);
  }
  @Post('/0')
  async sendPayWithOrange() {
    await utils.requestLocation('test demande localisation', '22660356506');
  }
  @Post('/5')
  async sendbuttonimage() {
    await utils.sendButtonMessage(
      '22660356506',
      'test',
      [
        {
          id: '54963888',
          title: 'Payer',
        },
        {
          id: '5496388',
          title: 'Annuler',
        },
      ],
      null,
      {
        type: 'image',
        image: {
          id: 1629914114460644,
        },
      },
    );
  }
  @Post('/7')
  async sendaudio() {
    // utils.sendCatalogMessage('22660356506', 'test', '1', 'test');
    // Exemple d'utilisation de la fonction addOrUpdateRow
    // const spreadsheetId = '18LqtF3o5V8OASnB4qsQ048Y7f51k0psM8PKSNqVu0dU';
    // const sheetName = 'Worksheet';
    // const columnName = 'id';
    // const columnValue = '2';
    // const rowData = ['123', 'John Doe', 'john.doe@example.com'];

    // utils.addOrUpdateRow(
    //   spreadsheetId,
    //   sheetName,
    //   columnName,
    //   columnValue,
    //   rowData,
    // );
    // Importer la fonction (assurez-vous que le chemin est correct)

    // Valeurs d'exemple pour les paramètres
    const destinataire = '22660256506';
    const templateName = 'summer_carousel_promo_2023';
    const languageCode = 'en_US';
    const category = 'MARKETING';
    const bubbleText =
      "Summer is here, and we've got the freshest produce around! Use code {{1}} to get {{2}} off your next order.";
    const bubbleTextVarExample = ['15OFF', '15%'];
    const cards = [
      {
        headerFormat: 'IMAGE',
        headerHandle: '4::aW...',
        bodyText:
          'Rare lemons for unique cocktails. Use code {{1}} to get {{2}} off all produce.',
        bodyTextVarExample: ['15OFF', '15%'],
        quickReplyButtonText: 'Send more like this',
        urlButtonText: 'Buy now',
        urlButtonUrl: 'https://www.luckyshrub.com/shop?promo={{1}}',
        urlButtonVarExample: 'summer_lemons_2023',
      },
      // Vous pouvez ajouter d'autres cartes ici si nécessaire
    ];

    // Appeler la fonction avec les valeurs d'exemple
    utils.sendCarouselMessage(
      destinataire,
      templateName,
      languageCode,
      category,
      bubbleText,
      bubbleTextVarExample,
      cards,
    );
  }
  @Post('/6')
  async uploadimage() {
    await utils.getSheetData();
  }
  @Post('/1')
  async reqestLocation() {
    // await utils
    //   .checkPayment('54963888', 400)
    //   .then((result) => {
    //     console.log(' Location');
    //     console.log(result);
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //   });
    await utils.sendFlow(
      '1158395898550311',
      '22660356506',
      'Test',
      'test',
      'test',
      'test',
    );
  }
  @Post('/2')
  async interactive() {
    await utils
      .sendButtonMessage(
        '22660356506',
        'test',
        [
          {
            id: '54963888',
            title: 'Payer',
          },
          {
            id: '5496388',
            title: 'Cancel',
          },
        ],
        'test',
      )
      .then((result) => {
        console.log(' Location');
        console.log(result);
      })
      .catch((err) => {
        console.error(err);
      });
    // await utils.sendFlow(
    //   '1158395898550311',
    //   '22660356506',
    //   'Test',
    //   'test',
    //   'test',
    //   'test',
    // );
  }
  @Post('/3')
  async list() {
    utils.sendListMessage('22660356506', 'Test', 'Test', 'Test', 'Test', [
      {
        title: 'Test',
        rows: [
          { id: '1', title: 'Test', description: 'Test' },
          { id: '2', title: 'Test', description: 'Test' },
        ],
      },
    ]);
  }
  @Post('/4')
  async cta() {
    utils.sendPayWithOrange('22660356506', '2000');
  }
  // @Post('/flow')
  // async flow() {
  // }
}
