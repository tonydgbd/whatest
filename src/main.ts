import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import WhatsApp from 'whatsapp';
import { config } from 'dotenv';
import { IncomingHttpHeaders, ServerResponse } from 'http';
import { WebhookObject } from 'whatsapp/build/types/webhooks';
import utils from './utils';
import { sleep } from 'openai/core';
//https://www.google.com/maps/search/?api=1&query=47.5951518%2C-122.3316393
const interaction = {
  button_reply: [
    {
      id: '1',
      handle: function (from: any) {
        console.log('Handle 1');
      },
    },
  ],
  list_reply: [
    {
      id: '1',
      handle: function (from: any) {
        console.log('Handle 1');
      },
    },
  ],
  nfm_reply: [
    {
      id: 'test',
      handle: function (data: any, from: any) {
        console.log(data);
      },
    },
  ],
  text_reply: [
    {
      trigger: ['salut', 'bonjour'],
      handle: function (data: any, from: any) {
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
const processedWebhooks = new Set<string>();
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
  console.log(bd.entry[0].changes[0].value.messages[0].id);
  const webhookId = bd.entry[0].changes[0].value.messages[0].id;

  // Vérifier si le webhook a déjà été traité
  if (processedWebhooks.has(webhookId)) {
    console.log(`Webhook ${webhookId} déjà traité.`);
    return;
  }

  // Marquer le webhook comme traité
  processedWebhooks.add(webhookId);

  // Traiter le webhook
  try {
    // Votre logique de traitement ici
    console.log(`Traitement du webhook ${webhookId}`);
  } catch (error) {
    console.error(`Erreur lors du traitement du webhook ${webhookId}:`, error);
  }
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
          from,
        );
      } else if (interactiveType === 'button_reply') {
        handleButtonReply(
          bd.entry[0].changes[0]['value']['messages'][0]['interactive'][
            'button_reply'
          ],
          from,
        );
      } else if (interactiveType === 'list_reply') {
        handleListReply(
          bd.entry[0].changes[0]['value']['messages'][0]['interactive'][
            'list_reply'
          ],
          from,
        );
      }
      break;
    case 'order':
      handleOrder(
        bd.entry[0].changes[0]['value']['messages'][0]['order'],
        from,
      );
      break;
    case 'text':
      console.log('Handling message');
      handleMessage(
        bd.entry[0].changes[0]['value']['messages'][0]['text'],
        from,
      );
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
  return {
    statusCode: statusCode,
    headers: headers,
    body: JSON.stringify({ message: 'Webhook processed successfully' }),
  };
}
async function handleLocation(body: any) {
  console.log('Handling location message');
  // {
  //   latitude: 12.0,
  //   longitude: 13.0,
  // }
  console.log(body);
  const data = await utils.getDistance(
    body.latitude,
    body.longitude,
    2.4043,
    -1.577843,
  );
  console.log(data);
  // Add your logic to handle location messages here
}
async function handleMessage(body: any, from: any) {
  console.log('Handling message');
  // { text: 'Test' }
  console.log(body);
  const inter = interaction.text_reply.find((element) =>
    element.trigger.includes(body.text),
  );
  console.log(inter);
  if (inter != undefined) {
    inter.handle(body, from);
  }
  // Add your logic to handle text messages here
}
async function handleOrder(body: any, from: any) {
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
  let total = 0;
  body.product_items.forEach((item) => {
    total += item.item_price * item.quantity;
  });
  console.log(body);
  await utils.requestLocation(
    'Cliquez sur le bouton ci-dessous pour partager votre localisation ',
    from,
  );
  await sleep(1000);
  await utils.sendPayWithOrange(from, total.toString());
  await sleep(1000);
  await utils.sendFlow(
    '1158395898550311',
    '22660356506',
    'Test',
    'test',
    'test',
    'FTX_PAYMENT',
  );
  interaction.nfm_reply.push({
    id: 'FTX_PAYMENT',
    handle: async function (data: any, from: any) {
      console.log(data);
      const rs = await utils.checkPayment(data.numero, data.amount);
      console.log(rs.success);
      if (rs.success == true) {
        utils.sendText(from, 'Paiment reussie');
      } else {
        utils.sendText(
          from,
          'Echec de la verification du paiment , taper ( /vr ) pour reesayer',
        );
        interaction.text_reply.push({
          trigger: ['/vr'],
          handle: async function () {
            await utils.sendFlow(
              '1158395898550311',
              '22660356506',
              'Test',
              'test',
              'test',
              'FTX_PAYMENT',
            );
          },
        });
      }
    },
  });
  // Add your logic to handle interactive messages here
}

function handleButtonReply(body: any, from: any) {
  console.log('Handling button reply');
  // { id: '5496388', title: 'Cancel' }
  interaction.button_reply
    .find((element) => element.id === body.id)
    .handle(from);

  // Add your logic to handle button replies here
}
function handleFlowReply(body: any, from: any) {
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
    .handle(body.response_json, from);

  // Add your logic to handle button replies here
}

function handleListReply(body: any, from: any) {
  console.log('Handling list reply');
  // { id: '1', title: 'Test', description: 'Test' }
  interaction.list_reply.find((element) => element.id === body.id).handle(from);
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
