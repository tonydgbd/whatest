import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import WhatsApp from 'whatsapp';
import { config } from 'dotenv';
import { IncomingHttpHeaders, ServerResponse } from 'http';
import { WebhookObject } from 'whatsapp/build/types/webhooks';

config();
// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
const senderNumber = 243410425511216;

const wa = new WhatsApp(Number(senderNumber));

async function custom_callback(
  statusCode: number,
  headers: IncomingHttpHeaders,
  body?: WebhookObject,
  response?: ServerResponse,
  error?: Error,
) {
  console.log(
    `Incoming webhook status code: ${statusCode}\n\nHeaders:${JSON.stringify(headers)}\n\nBody: ${JSON.stringify(body)}`,
  );
  const bd = JSON.parse(JSON.stringify(body));
  console.log(bd.entry[0].changes[0]['value']['messages'][0]);
  if (response) {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end();
  }

  if (error) {
    console.log(`ERROR: ${error}`);
  }
}

try {
  console.log('is started ' + wa.webhooks.isStarted());
  wa.webhooks.start(custom_callback);
  console.log('is started now ' + wa.webhooks.isStarted());
} catch (error) {
  console.error(error);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
}
bootstrap();
