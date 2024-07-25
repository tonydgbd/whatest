import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import WhatsApp from 'whatsapp';
import { config } from 'dotenv';
import { IncomingHttpHeaders, ServerResponse } from 'http';
import { WebhookObject } from 'whatsapp/build/types/webhooks';
import utils from './utils';

config();
// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
const senderNumber = 243410425511216;
// [
//   {
//     context: {
//       from: '22654963888',
//       id: 'wamid.HBgLMjI2NjAzNTY1MDYVAgARGBI2QjY0MDRGMkQ4MDQ3RTlCRkEA'
//     },
//     from: '22660356506',
//     id: 'wamid.HBgLMjI2NjAzNTY1MDYVAgASGBQzQTBCRkY1MDVDREFCQjdERTlGNQA=',
//     timestamp: '1721941410',
//     type: 'interactive',
//     interactive: { type: 'nfm_reply', nfm_reply: [Object] }
//   }
// ]
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
  console.log(bd.entry[0].changes[0]['value']['messages']);
  if (
    bd.entry[0].changes[0]['value']['messages'] &&
    bd.entry[0].changes[0]['value']['messages'][0]['type'] === 'interactive' &&
    bd.entry[0].changes[0]['value']['messages'][0]['interactive']['type'] ==
      'nfm_reply'
  ) {
    // response_json: '{"reseau":"0_ORANGE_Money","flow_token":"test","numero":"54963888"}',
    console.log(
      bd.entry[0].changes[0]['value']['messages'][0]['interactive'][
        'nfm_reply'
      ],
    );
    const numero =
      bd.entry[0].changes[0]['value']['messages'][0]['interactive'][
        'nfm_reply'
      ]['numero'];
    const isorange: boolean =
      bd.entry[0].changes[0]['value']['messages'][0]['interactive'][
        'nfm_reply'
      ]['numero'] === '0_ORANGE_Money';
    utils
      .checkPayment(numero, 400)
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.error(err);
      });
  }
  // [
  //   {
  //     from: '22660356506',
  //     id: 'wamid.HBgLMjI2NjAzNTY1MDYVAgASGBQzQUUyNDBFNTE1OUEyMkUyMzcyRQA=',
  //     timestamp: '1721946607',
  //     type: 'order',
  //     order: {
  //       catalog_id: '1772883193117356',
  //       text: '',
  //       product_items: [Array]
  //     }
  //   }
  // ]

  if (
    bd.entry[0].changes[0]['value']['messages'] &&
    bd.entry[0].changes[0]['value']['messages'][0]['type'] === 'order' &&
    bd.entry[0].changes[0]['value']['messages'][0]['order']
  ) {
    console.log(bd.entry[0].changes[0]['value']['messages'][0]['order']);
  }

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
} catch (error) {
  console.error(error);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await wa.webhooks.start(custom_callback);
  console.log('is started now ' + wa.webhooks.isStarted());

  await app.listen(3001);
}
bootstrap();
