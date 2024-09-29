import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import WhatsApp from 'whatsapp';
import { config } from 'dotenv';
import { IncomingHttpHeaders, ServerResponse } from 'http';
import { WebhookObject } from 'whatsapp/build/types/webhooks';
import utils from './utils';
import { AppService } from './app.service';
import * as admin from 'firebase-admin';
import * as serviceAccount from 'fourevent-ea1dc-firebase-adminsdk-umgvu-79c791d1c7.json';
import { ConversationStateService } from './conversation-state/conversation-state.service';
import { DirectusServiceService } from './directus-service/directus-service.service';
import { EventEmitter } from 'events';
config();
// https://www.google.com/maps/search/?api=1&query=47.5951518%2C-122.3316393
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL:
    'https://fourevent-ea1dc-default-rtdb.europe-west1.firebasedatabase.app',
});

async function bootstrap() {
  EventEmitter.defaultMaxListeners = 10;
  const wa = new WhatsApp(Number(process.env.WA_PHONE_NUMBER_ID));
  const app = await NestFactory.create(AppModule);
  // await wa.webhooks.start(handleWebhookforEcommerce);
  // console.log('is started now ' + wa.webhooks.isStarted());
  app.listen(80);
}
bootstrap();
