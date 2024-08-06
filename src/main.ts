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
import { ConversationStateService } from './conversation-state/conversation-state.service';

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

type HandleFlowReplyCllBack = (body: any, from: any) => void;
type HandleButtonClickCllBack = (body: any, from: any) => void;
type HandleListClickCllBack = (body: any, from: any) => void;
type HandleOrderCllBack = (body: any, from: any) => void;
type HandleLocationCllBack = (body: any, from: any) => void;
type HandleMessageCllBack = (body: any, from: any, from_name: string) => void;
function handleMesage(
  bd: any,
  messageType: any,
  from: string,
  from_name: string,
  handleFlowReply?: HandleFlowReplyCllBack,
  handleButtonReply?: HandleButtonClickCllBack,
  handleListReply?: HandleListClickCllBack,
  handleOrder?: HandleOrderCllBack,
  handleLocation?: HandleLocationCllBack,
  handleMessage?: HandleMessageCllBack,
) {
  try {
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
          from,
        );
        // Add your logic to handle location here
        break;
      default:
        console.log(`Unhandled message type: ${messageType}`);
    }
  } catch (e) {
    console.log(e);
  }
}

async function handleWebhookforEcommerce(
  statusCode: number,
  headers: IncomingHttpHeaders,
  body?: WebhookObject,
  response?: ServerResponse,
) {
  if (!body) {
    console.log('No body in webhook');
    return;
  }
  enum steps {
    initial,
    first_message_send,
    awaiting_order_message,
    awaiting_location,
    awaiting_payment_method,
    awaiting_payment_confirmation,
    end_of_conversation,
  }
  console.log(JSON.stringify(body));

  const conversationService = new ConversationStateService();

  const bd = JSON.parse(JSON.stringify(body));
  if (bd.entry[0].changes[0].value.messages == undefined) {
    console.log('No message in webhook');
    return;
  }
  const from = bd.entry[0].changes[0].value.messages[0].from;
  const messageType = bd.entry[0].changes[0].value.messages[0].type;
  const from_name = bd.entry[0].changes[0].value.contacts[0].profile.name;
  const WA_PHONE_NUMBER_ID =
    bd.entry[0].changes[0].value.metadata.phone_number_id;
  console.log(`Received message from ${from} of type ${messageType}`);
  // Récupérer l'état de la conversation de l'utilisateur
  // eslint-disable-next-line no-var
  var conversationState = await conversationService.getConversationState(from);
  console.log(conversationState);
  if (!conversationState) {
    conversationState = { step: steps.initial, data: {} };
  }

  // Logique de traitement basée sur l'état de la conversation
  switch (conversationState.step) {
    case steps.initial:
      // Récupérer le message de démarrage de l'utilisateur
      await utils.sendText(
        from,
        `Bonjour ${from_name} je suis l'assistant de commande`,
        WA_PHONE_NUMBER_ID,
      );
      await utils.sendText(
        from,
        `ci dessous les produits disponibles , veuillez faire votre choix et placer la commande`,
        WA_PHONE_NUMBER_ID,
      );
      await utils.sendCatalogMessage(
        from,
        'Produit disponible ',
        '6a2oF457UmRioaZ4B3ESpj',
        '1',
        WA_PHONE_NUMBER_ID,
      );
      conversationState.step = steps.awaiting_order_message;
      break;
    case steps.first_message_send:
      // Récupérer la réponse de l'utilisateur
      conversationState.step = steps.awaiting_order_message;
      break;
    case steps.awaiting_order_message:
      // Récupérer la réponse de l'utilisateur
      console.log(body);
      handleMesage(
        bd,
        messageType,
        from,
        from_name,
        null,
        null,
        null,
        async (body: any, from: any) => {
          console.log('Handling order message');
          console.log(body);
          // const bod = bd.entry[0].changes[0]['value']['messages'][0]['order'];
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
          console.log(`Total : ${total} XOF`);
          const data = {
            order: body,
          };
          await utils.requestLocation(
            'Cliquez sur le bouton ci-dessous pour partager votre localisation ',
            from,
            WA_PHONE_NUMBER_ID,
          );
          conversationState.step = steps.awaiting_location;
          conversationState.data = data;
          await conversationService.updateConversationState(
            from,
            conversationState,
          );
        },
      );
      break;
    case steps.awaiting_location:
      // Récupérer la réponse de l'utilisateur
      if (messageType != 'location') {
        if (response != null) {
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ status: 'success' }));
        }
        return;
      }
      handleMesage(
        bd,
        messageType,
        from,
        from_name,
        null,
        null,
        null,
        null,
        async (body, from) => {
          console.log(body);
          conversationState.step = steps.awaiting_payment_method;
          conversationState.data.location = body;
          await conversationService.updateConversationState(
            from,
            conversationState,
          );
          await utils.sendText(
            from,
            `Votre localisation a été enregistrée avec succès`,
            WA_PHONE_NUMBER_ID,
          );
          await utils.sendText(
            from,
            `Pour terminer votre achat et recevoir votre ticket numerique vous allez devoir effectuer un depot Orange ou moov en utilisant le bouton qui suivra puis insere le numero utiliser pour faire le depot dans le formulaire qui suit`,
            WA_PHONE_NUMBER_ID,
          );
          let total = 0;
          conversationState.data.order.product_items.forEach((item) => {
            total += item.item_price * item.quantity;
          });
          await utils.sendPayWithOrange(
            from,
            total.toString(),
            WA_PHONE_NUMBER_ID,
          );
          await sleep(5000); // Attendre 10 secondes pour le dépôt
          await utils.sendFlow(
            '1158395898550311',
            from,
            'Formulaire de confirmation du paiement',
            'Taper votre numero sans l indicatif ',
            'FUTURIX PAY',
            `FTX_PAYMENT_${conversationState.data.order.catalog_id}_${from}_${total}`,
            WA_PHONE_NUMBER_ID,
          );
          conversationState.step = steps.awaiting_payment_confirmation;
          conversationState.total = total;
          await conversationService.updateConversationState(
            from,
            conversationState,
          );
        },
        null,
      );
      break;
    case steps.awaiting_payment_confirmation:
      // Récupérer la réponse de l'utilisateur a flow
      handleMesage(
        bd,
        messageType,
        from,
        from_name,
        async (body: any, from: any) => {
          console.log(body);
          const dt = JSON.parse(body.response_json);
          const rs = await utils.checkPayment(
            dt.numero,
            conversationState.total.toString(),
          );
          console.log(rs.success);
          if (rs.success == true) {
            //register order
          } else {
            //handle order gdasza hfzavfewaadzcff1  23454655qwe7]0875432``1223r69-b
          }
        },
      );
      break;
    case steps.awaiting_payment_confirmation:
      // Récupérer la réponse de l'utilisateur
      conversationState.step = steps.end_of_conversation;
      break;
    case steps.end_of_conversation:
      // Récupérer la réponse de l'utilisateur
      conversationState.step = steps.end_of_conversation;
  }

  // Mettre à jour l'état de la conversation de l'utilisateur
  await conversationService.updateConversationState(from, conversationState);

  if (response != null) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: 'success' }));
  }
}

async function bootstrap() {
  const wa = new WhatsApp(Number(process.env.WA_PHONE_NUMBER_ID));
  const app = await NestFactory.create(AppModule);
  await wa.webhooks.start(handleWebhookforEcommerce);
  console.log('is started now ' + wa.webhooks.isStarted());
  await app.listen(3001);
}
bootstrap();
