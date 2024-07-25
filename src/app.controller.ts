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
  reqestLocation() {
    utils.requestLocation('demande de loca ', '22660356506');
  }
}
