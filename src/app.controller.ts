import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';
import utils from './utils';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Post('/messages')
  getMessages(req: Request) {
    console.log(req.body);
  }
  @Post('/sendReauestLocation')
  async reqestLocation() {
    await utils
      .checkPayment('54963888', 400)
      .then((result) => {
        console.log(" Location");
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
}
