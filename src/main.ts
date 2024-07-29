import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import WhatsApp from 'whatsapp';
import { config } from 'dotenv';
import { IncomingHttpHeaders, ServerResponse } from 'http';
import { WebhookObject } from 'whatsapp/build/types/webhooks';
import utils from './utils';

const interaction = {
  button_reply: [
    {
      id: '1',
      handle: function () {
        console.log('Handle 1');
      },
    },
  ],
  list_reply: [
    {
      id: '1',
      handle: function () {
        console.log('Handle 1');
      },
    },
  ],
  nfm_reply: [
    {
      id: 'test',
      handle: function (data: any) {
        console.log(data);
      },
    },
  ],
};
// import OpenAI from 'openai';
config();

// const openai = new OpenAI();

// main();
// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
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
async function handleWebhook(
  statusCode: number,
  headers: IncomingHttpHeaders,
  body?: WebhookObject,
) {
  if (!body) {
    console.log('No body in webhook');
    return;
  }
  const bd = JSON.parse(JSON.stringify(body));
  if (bd.entry[0].changes[0].value.messages === undefined) {
    console.log('No messages in webhook');
    return;
  }

  const messageType = bd.entry[0].changes[0].value.messages[0].type;
  const from = bd.entry[0].changes[0].value.messages[0].from;
  console.log(`Received message from ${from} of type ${messageType}`);
  switch (messageType) {
    case 'interactive':
      const interactiveType =
        bd.entry[0].changes[0]['value']['messages'][0]['interactive']['type'];
      if (interactiveType === 'nfm_reply') {
        console.log('Handling nfm reply');
        handleFlowReply(
          bd.entry[0].changes[0]['value']['messages'][0]['interactive'][
            'nfm_reply'
          ],
        );
      } else if (interactiveType === 'button_reply') {
        handleButtonReply(
          bd.entry[0].changes[0]['value']['messages'][0]['interactive'][
            'button_reply'
          ],
        );
      } else if (interactiveType === 'list_reply') {
        handleListReply(
          bd.entry[0].changes[0]['value']['messages'][0]['interactive'][
            'list_reply'
          ],
        );
      }
      break;
    case 'order':
      handleOrder(bd.entry[0].changes[0]['value']['messages'][0]['order']);
      break;
    case 'text':
      console.log('Handling message');
      handleMessage(bd.entry[0].changes[0]['value']['messages'][0]['text']);
      // Add your logic to handle messages here
      break;
    case 'location':
      console.log('Handling location');
      handleLocation(
        bd.entry[0].changes[0]['value']['messages'][0]['location'],
      );
      // Add your logic to handle location here
      break;
    default:
      console.log(`Unhandled message type: ${messageType}`);
  }
}
async function handleLocation(body: any) {
  console.log('Handling location message');
  // {
  //   latitude: 12.0,
  //   longitude: 13.0,
  // }
  console.log(body);
  // Add your logic to handle location messages here
}
async function handleMessage(body: any) {
  console.log('Handling message');
  // { text: 'Test' }
  console.log(body);
  // Add your logic to handle text messages here
}
function handleOrder(body: any) {
  console.log('Handling order message');
  // {
  //   catalog_id: '1772883193117356',
  //   text: '',
  //   product_items: [
  //     {
  //       product_retailer_id: '2',
  //       quantity: 1,
  //       item_price: 750,
  //       currency: 'XOF'
  //     }
  //   ]
  // }
  console.log(body);
  // Add your logic to handle interactive messages here
}

function handleButtonReply(body: any) {
  console.log('Handling button reply');
  // { id: '5496388', title: 'Cancel' }
  interaction.button_reply.find((element) => element.id === body.id).handle();

  // Add your logic to handle button replies here
}
function handleFlowReply(body: any) {
  console.log('Handling button reply');
  // {
  //   response_json: '{"flow_token":"test","numero":"54963888","reseau":"0_ORANGE_Money"}',
  //   body: 'Sent',
  //   name: 'flow'
  // }
  console.log(body);
  const response_json = JSON.parse(body.response_json);
  interaction.nfm_reply
    .find((element) => element.id === response_json.flow_token)
    .handle(body.response_json);

  // Add your logic to handle button replies here
}

function handleListReply(body: any) {
  console.log('Handling list reply');
  // { id: '1', title: 'Test', description: 'Test' }
  interaction.list_reply.find((element) => element.id === body.id).handle();
  console.log(body);

  // Add your logic to handle list replies here
}

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
      .checkPayment(numero, '400')
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
  // [
  //   {
  //     context: {
  //       from: '22654963888',
  //       id: 'wamid.HBgLMjI2NjAzNTY1MDYVAgARGBIzQzM5MkVFQjg1QjAzODI5RTEA'
  //     },
  //     from: '22660356506',
  //     id: 'wamid.HBgLMjI2NjAzNTY1MDYVAgASGBQzQTA3Qjg0RDlBQjlGMjVFMEZENAA=',
  //     timestamp: '1721983763',
  //     type: 'interactive',
  //     interactive: { type: 'button_reply', button_reply: [Object] }
  //   }
  // ]
  if (
    bd.entry[0].changes[0]['value']['messages'] &&
    bd.entry[0].changes[0]['value']['messages'][0]['type'] === 'interactive' &&
    bd.entry[0].changes[0]['value']['messages'][0]['interactive']['type'] ===
      'button_reply'
  ) {
    console.log(
      bd.entry[0].changes[0]['value']['messages'][0]['interactive'][
        'button_reply'
      ],
    );
  }
  // [
  //   {
  //     context: {
  //       from: '22654963888',
  //       id: 'wamid.HBgLMjI2NjAzNTY1MDYVAgARGBI1NDJGMkNFN0I4NjUxODA2NTcA'
  //     },
  //     from: '22660356506',
  //     id: 'wamid.HBgLMjI2NjAzNTY1MDYVAgASGBQzQTQyQ0M4QTMxODU1NkI5QTBGRgA=',
  //     timestamp: '1721984205',
  //     type: 'interactive',
  //     interactive: { type: 'list_reply', list_reply: [Object] }
  //   }
  // ]
  if (
    bd.entry[0].changes[0]['value']['messages'] &&
    bd.entry[0].changes[0]['value']['messages'][0]['type'] === 'interactive' &&
    bd.entry[0].changes[0]['value']['messages'][0]['interactive']['type'] ===
      'list_reply'
  ) {
    console.log(
      bd.entry[0].changes[0]['value']['messages'][0]['interactive'][
        'list_reply'
      ],
    );
  }

  if (response) {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end();
  }

  if (error) {
    console.log(`ERROR: ${error}`);
  }
}

async function bootstrap() {
  const wa = new WhatsApp(Number(process.env.WA_PHONE_NUMBER_ID));
  const app = await NestFactory.create(AppModule);
  await wa.webhooks.start(handleWebhook);
  console.log('is started now ' + wa.webhooks.isStarted());
  // await wa.webhooks.stop((err)=> console.log(err));
  await app.listen(3001);
}
bootstrap();
