import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import WhatsApp from 'whatsapp';
import { config } from 'dotenv';
import { IncomingHttpHeaders, ServerResponse } from 'http';
import { WebhookObject } from 'whatsapp/build/types/webhooks';
import utils from './utils';
import { sleep } from 'openai/core';
import { AppService } from './app.service';
import * as admin from 'firebase-admin';
import * as serviceAccount from 'fourevent-ea1dc-firebase-adminsdk-umgvu-79c791d1c7.json';

//https://www.google.com/maps/search/?api=1&query=47.5951518%2C-122.3316393
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL:
    'https://fourevent-ea1dc-default-rtdb.europe-west1.firebasedatabase.app',
});
const eventService = new AppService();

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
      trigger: ['salut'],
      handle: async function (data: any, from: any, from_name: string) {
        console.log(data);
        const events = await eventService.getEvents();
        console.log(events);
        const updatedEvents = await Promise.all(
          events.map(async (event) => {
            if (event.imageID != null) {
              const updatedImageID = await eventService.saveEventImageID(
                event.covers[0],
                event.name,
              );
              console.log(updatedImageID);
              return { ...event, imageID: updatedImageID };
            }
            return event;
          }),
        );
        await utils.sendText(
          from,
          `Bonjour ${from_name} Bienvue sur le service Billeterie de easyPass Burkina `,
        );
        await sleep(1000);

        // Si vous avez besoin de mettre à jour l'array original
        let response = `Voici les prochains évènements à venir:\n`;
        updatedEvents.forEach((event) => {
          response += `- ${event.name}\n`;
        });
        console.log(response);
        await utils.sendText(from, response);

        events.forEach(async (event) => {
          const bodymsg = `${event.name} \n ${event.description}  \nDate debut: ${new Date(event.startDate_seconds * 1000).toLocaleDateString()} \nDate de fin: ${new Date(event.endDate._seconds * 1000).toLocaleDateString()} \n Lieu :${event.nomLieu}`;
          interaction.button_reply.push({
            id: `Achat_ticket(${event.name})_${from}`,
            handle: async function (from: any) {
              const typetik = await eventService.getTypeTickets(event.name);
              typetik
                .filter(
                  (val) =>
                    val.hiddenAfter._seconds * 1000 &&
                    Date.now() >= val.hiddenuntil._seconds * 1000,
                )
                .forEach((type) => {
                  interaction.list_reply.push({
                    id: `ticket(${type.name})_${from}`,
                    handle: async function (from: any) {
                      if (type.isfree) {
                        const code = await eventService.createTicket(
                          event.name,
                          type.name,
                          from,
                        );
                        console.log('Code ticket', code);
                        // const { id } = await utils.uploadImage(
                        //   `https://quickchart.io/qr?text=${code}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`,
                        // );
                        await utils.sendImage(
                          from,
                          `https://quickchart.io/qr?text=${code}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`,
                        );
                        await utils.sendText(
                          from,
                          `Il est important de garder ce code Qr car il constitue votre tikcet et sera scanner au porte de l'evenement , veuiller ne pas le partager carr chaque tikcet est unique et sera scanner dans le cas ou le ticket a ete partager il sera invalide`,
                        );
                      } else {
                        await utils.sendText(
                          from,
                          `Vous avez choisi le ticket ${type.name} d'une valeur de ${type.name}, Pour terminer votre achat et recevoir votre ticket numerique vous allez devoir effectuer un depot Orange ou moov en utilisant le bouton qui suivra puis insere le numero utiliserpour faire le depot dans le formulaire qui suit`,
                        );
                        await utils.sendPayWithOrange(
                          from,
                          type.prix.toString(),
                        );
                        await sleep(5000); // Attendre 10 secondes pour le dépôt
                        await utils.sendFlow(
                          '1158395898550311',
                          from,
                          'Formulaire de validation du paiment',
                          'Taper votre numero sans l indicatif ',
                          'FUTURIX PAY',
                          `FTX_PAYMENT_${type.name}_${from}_${type.prix}_${from}`,
                        );
                        interaction.nfm_reply.push({
                          id: `FTX_PAYMENT_${type.name}_${from}_${type.prix}_${from}`,
                          handle: async function (data: any, from: any) {
                            const dt = JSON.parse(data);
                            const rs = await utils.checkPayment(
                              dt.numero,
                              type.prix.toString(),
                            );
                            console.log(rs.success);
                            if (rs.success == true) {
                              utils.sendText(from, 'Paiment reussie');
                              const code = await eventService.createTicket(
                                event.name,
                                type.name,
                                from,
                              );
                              console.log('Code ticket', code);
                              const { id } = await utils.uploadImage(
                                `https://quickchart.io/qr?text=${code}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`,
                              );
                              await utils.sendImagebyId(from, id);
                              await utils.sendText(
                                from,
                                `Il est important de garder ce code Qr car il constitue votre tikcet et sera scanner au porte de l'evenement , veuiller ne pas le partager carr chaque tikcet est unique et sera scanner dans le cas ou le ticket a ete partager il sera invalide`,
                              );
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
                                    from,
                                    'Formulaire de validation du paiment',
                                    'Taper votre numero sans l indicatif ',
                                    'FUTURIX PAY',
                                    `FTX_PAYMENT_${type.name}_${from}_${type.prix}`,
                                  );
                                },
                              });
                            }
                          },
                        });
                      }
                    },
                  });
                });
              utils.sendListMessage(
                from,
                'Ticket disponible',
                'Choissisez le ticket que vous voulez acheter',
                'easypass',
                'voir les tickets',
                [
                  {
                    title: 'jour 1',
                    rows: [
                      ...typetik.map((type) => {
                        return {
                          id: `ticket(${type.name})_${from}`,
                          title: type.name,
                          description: type.isfree
                            ? 'Ticket gratuit'
                            : type.description + ' ' + type.prix,
                        };
                      }),
                    ],
                  },
                ],
              );
            },
          });
          await utils.sendButtonMessage(
            from,
            bodymsg,
            [
              {
                id: `Achat_ticket(${event.name})_${from}`,
                title: 'Acheter un ticket',
              },
            ],
            'EasyPass Burkina',
            {
              type: 'image',
              image: {
                link: event.covers[0],
              },
            },
          );
        });
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
  response?: ServerResponse,
) {
  if (!body) {
    console.log('No body in webhook');
    return;
  }
  console.log(JSON.stringify(body));

  const bd = JSON.parse(JSON.stringify(body));

  if (bd.entry[0].changes[0].value.messages === undefined) {
    console.log('No messages in webhook');
    return;
  }
  const messageType = bd.entry[0].changes[0].value.messages[0].type;
  const from = bd.entry[0].changes[0].value.messages[0].from;
  const from_name = bd.entry[0].changes[0].value.contacts[0].profile.name;
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
    console.log(`Traitement du webhook ${bd}`);
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
        from_name,
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
  console.log('Webhook processed successfully');
  if (response != null) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: 'success' }));
  }
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
async function handleMessage(body: any, from: any, from_name: any) {
  console.log('Handling message');
  // { text: 'Test' }
  console.log(body);
  // const inter = interaction.text_reply.find((r) => r.trigger === body.text);
  // console.log(inter);
  // if (inter != undefined) {
  //   inter.handle(body, from);
  // }
  await interaction.text_reply[0].handle(body, from, from_name);
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
  const interr = interaction.button_reply.find(
    (element) => element.id === body.id,
  );
  if (interr != null) {
    interr.handle(from);
  } else {
  }

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
  const inter = interaction.nfm_reply.find(
    (element) => element.id === response_json.flow_token,
  );
  if (inter != null) {
    inter.handle(body.response_json, from);
  }

  // Add your logic to handle button replies here
}

function handleListReply(body: any, from: any) {
  console.log('Handling list reply');
  // { id: '1', title: 'Test', description: 'Test' }
  const inter = interaction.list_reply.find((element) => element.id == body.id);
  if (inter != null) {
    inter.handle(from);
  } else {
    console.log('Interaction not found');
  }
  console.log(body);

  // Add your logic to handle list replies here
}

async function bootstrap() {
  const wa = new WhatsApp(Number(process.env.WA_PHONE_NUMBER_ID));
  const app = await NestFactory.create(AppModule);
  await wa.webhooks.start(handleWebhook);
  console.log('is started now ' + wa.webhooks.isStarted());
  await app.listen(3001);
}
bootstrap();
