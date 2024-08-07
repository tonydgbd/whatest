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
import { DirectusServiceService } from './directus-service/directus-service.service';
type typeTicket = {
  showqty: boolean;
  hiddenuntil: {
    _seconds: number;
    _nanoseconds: number;
  };
  prix: number;
  name: string;
  description: string;
  isLiveOnly: boolean;
  participants: string[];
  isLive: boolean;
  hasLive: boolean;
  liveID: string;
  isfree: boolean;
  price_per_status: number[];
  free_for_status: number;
  dateDebutValidite: {
    _seconds: number;
    _nanoseconds: number;
  };
  dateFinValidite: {
    _seconds: number;
    _nanoseconds: number;
  };
  hiddenAfter: {
    _seconds: number;
    _nanoseconds: number;
  };
  quantity: number;
  vente: number;
};
// https://www.google.com/maps/search/?api=1&query=47.5951518%2C-122.3316393
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL:
    'https://fourevent-ea1dc-default-rtdb.europe-west1.firebasedatabase.app',
});
const eventService = new AppService();
config();
type OrderBody = {
  catalog_id: number;
  text: string;
  product_items: [
    {
      product_retailer_id: number;
      quantity: number;
      item_price: number;
      currency: string;
    },
  ];
};
type ListBody = {
  id: string;
  title: string;
  description: string;
};
type MessageBody = {
  text: string;
};

type HandleFlowReplyCllBack = (body: any, from: any) => void;
type HandleButtonClickCllBack = (body: ListBody, from: any) => void;
type HandleListClickCllBack = (body: ListBody, from: any) => void;
type HandleOrderCllBack = (body: OrderBody, from: any) => void;
type HandleLocationCllBack = (body: any, from: any) => void;
type HandleMessageCllBack = (
  body: MessageBody,
  from: any,
  from_name: string,
) => void;
type HandleMessageFunction = {
  bd: any;
  messageType: any;
  from: string;
  from_name: string;
  handleFlowReply?: HandleFlowReplyCllBack;
  handleButtonReply?: HandleButtonClickCllBack;
  handleListReply?: HandleListClickCllBack;
  handleOrder?: HandleOrderCllBack;
  handleLocation?: HandleLocationCllBack;
  handleMessage?: HandleMessageCllBack;
};
function handleMesage(HandleMessageFunction: HandleMessageFunction) {
  switch (HandleMessageFunction.messageType) {
    case 'interactive':
      const interactiveType =
        HandleMessageFunction.bd.entry[0].changes[0]['value']['messages'][0][
          'interactive'
        ]['type'];
      if (interactiveType === 'nfm_reply') {
        console.log('Handling nfm reply');
        if (HandleMessageFunction.handleFlowReply == null) {
          throw new Error('handleFlowReply is not defined');
        }
        HandleMessageFunction.handleFlowReply(
          HandleMessageFunction.bd.entry[0].changes[0]['value']['messages'][0][
            'interactive'
          ]['nfm_reply'],
          HandleMessageFunction.from,
        );
      } else if (interactiveType === 'button_reply') {
        if (HandleMessageFunction.handleButtonReply == null) {
          throw new Error('handleButtonReply is not defined');
        }
        HandleMessageFunction.handleButtonReply(
          HandleMessageFunction.bd.entry[0].changes[0]['value']['messages'][0][
            'interactive'
          ]['button_reply'],
          HandleMessageFunction.from,
        );
      } else if (interactiveType === 'list_reply') {
        if (HandleMessageFunction.handleListReply == null) {
          throw new Error('handleListReply is not defined');
        }
        HandleMessageFunction.handleListReply(
          HandleMessageFunction.bd.entry[0].changes[0]['value']['messages'][0][
            'interactive'
          ]['list_reply'],
          HandleMessageFunction.from,
        );
      }
      break;
    case 'order':
      if (HandleMessageFunction.handleOrder == null) {
        throw new Error('handleOrder is not defined');
      }

      HandleMessageFunction.handleOrder(
        HandleMessageFunction.bd.entry[0].changes[0]['value']['messages'][0][
          'order'
        ],
        HandleMessageFunction.from,
      );
      break;
    case 'text':
      if (HandleMessageFunction.handleMessage == null) {
        throw new Error('handleMessage is not defined');
      }
      console.log('Handling message');
      HandleMessageFunction.handleMessage(
        HandleMessageFunction.bd.entry[0].changes[0]['value']['messages'][0][
          'text'
        ],
        HandleMessageFunction.from,
        HandleMessageFunction.from_name,
      );
      // Add your logic to handle messages here
      break;
    case 'location':
      console.log('Handling location');
      if (HandleMessageFunction.handleLocation == null) {
        throw new Error('handleLocation is not defined');
      }
      HandleMessageFunction.handleLocation(
        HandleMessageFunction.bd.entry[0].changes[0]['value']['messages'][0][
          'location'
        ],
        HandleMessageFunction.from,
      );
      // Add your logic to handle location here
      break;
    default:
      console.log(
        `Unhandled message type: ${HandleMessageFunction.messageType}`,
      );
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
  enum stepsEventBooking {
    initial,
    awaiting_event_selection,
    awaiting_ticket_selection,
    awaiting_quantity_selection,
    awaiting_payment_confirmation,
    end_of_conversation,
    payement_failed,
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
  if (WA_PHONE_NUMBER_ID == '243410425511216') {
    let conversationState = await conversationService.getConversationState(
      from,
      WA_PHONE_NUMBER_ID,
    );
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
          WA_PHONE_NUMBER_ID,
          `Bonjour ${from_name} je suis l'assistant de commande`,
        );
        await utils.sendText(
          from,
          WA_PHONE_NUMBER_ID,
          `ci dessous les produits disponibles , veuillez faire votre choix et placer la commande`,
        );
        await utils.sendCatalogMessage(
          from,
          WA_PHONE_NUMBER_ID,
          'Produit disponible ',
          'DikMJQdsD6KWbAWSTKM2Gz',
          '1',
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
        handleMesage({
          bd,
          messageType,
          from,
          from_name,
          handleOrder: async (body: any, from: any) => {
            console.log('Handling order message');
            console.log(body);
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
              WA_PHONE_NUMBER_ID,
            );
          },
        });
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
        handleMesage({
          bd,
          messageType,
          from,
          from_name,
          handleLocation: async (body, from) => {
            console.log(body);
            conversationState.step = steps.awaiting_payment_method;
            conversationState.data.location = body;
            await conversationService.updateConversationState(
              from,
              conversationState,
              WA_PHONE_NUMBER_ID,
            );
            await utils.sendText(
              from,
              WA_PHONE_NUMBER_ID,
              `Votre localisation a été enregistrée avec succès`,
            );
            await utils.sendText(
              from,
              WA_PHONE_NUMBER_ID,
              `Pour terminer votre achat et recevoir votre ticket numerique vous allez devoir effectuer un depot Orange ou moov en utilisant le bouton qui suivra puis insere le numero utiliser pour faire le depot dans le formulaire qui suit`,
            );
            let total = 0;
            conversationState.data.order.product_items.forEach((item) => {
              total += item.item_price * item.quantity;
            });
            await utils.sendPayWithOrange(
              from,
              WA_PHONE_NUMBER_ID,
              total.toString(),
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
              WA_PHONE_NUMBER_ID,
            );
          },
        });
        break;
      case steps.awaiting_payment_confirmation:
        // Récupérer la réponse de l'utilisateur a flow
        handleMesage({
          bd,
          messageType,
          from,
          from_name,
          handleFlowReply: async (body: any, from: any) => {
            const directusService = new DirectusServiceService();
            console.log(body);
            const dt = JSON.parse(body.response_json);
            const rs = await utils.checkPayment(
              dt.numero,
              conversationState.total.toString(),
            );
            console.log(rs.success);
            if (true) {
              //register order
              directusService.createOrder(
                conversationState,
                from,
                WA_PHONE_NUMBER_ID,
              );
              await utils.sendText(
                from,
                WA_PHONE_NUMBER_ID,

                `Votre commande a été enregistrée avec succès`,
              );
              conversationState.step = steps.end_of_conversation;
              await conversationService.updateConversationState(
                from,
                conversationState,
                WA_PHONE_NUMBER_ID,
              );
            } else {
              //handle order gdasza hfzavfewaadzcff1  23454655qwe7]0875432``1223r69-b
            }
          },
        });
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
    await conversationService.updateConversationState(
      from,
      conversationState,
      WA_PHONE_NUMBER_ID,
    );
  } else if (WA_PHONE_NUMBER_ID == '378202835367658') {
    let conversationState = await conversationService.getConversationState(
      from,
      WA_PHONE_NUMBER_ID,
    );

    if (!conversationState) {
      conversationState = { step: stepsEventBooking.initial, data: {} };
    }
    console.log(conversationState);
    try {
      switch (conversationState.step) {
        case stepsEventBooking.initial:
          const events = await eventService.getEvents();
          console.log(events);
          await utils.sendText(
            from,
            WA_PHONE_NUMBER_ID,
            `Bonjour ${from_name} Bienvue sur le service Billeterie de easyPass Burkina `,
          );
          await sleep(1000);

          // Si vous avez besoin de mettre à jour l'array original
          let response = `Voici les prochains évènements à venir:\n`;
          events.forEach((event) => {
            response += `- ${event.name}\n`;
          });
          console.log(response);
          await utils.sendText(from, WA_PHONE_NUMBER_ID, response);
          events.forEach(async (event) => {
            const bodymsg = `${event.name} \n ${event.description}  \nDate debut: ${new Date(event.startDate._seconds * 1000).toLocaleDateString()} \nDate de fin: ${new Date(event.endDate._seconds * 1000).toLocaleDateString()} \n Lieu :${event.nomLieu}`;
            await utils.sendButtonMessage(
              from,
              WA_PHONE_NUMBER_ID,
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
          conversationState.step = stepsEventBooking.awaiting_event_selection;
          await conversationService.updateConversationState(
            from,
            conversationState,
            WA_PHONE_NUMBER_ID,
          );
          break;
        case stepsEventBooking.awaiting_event_selection:
          handleMesage({
            bd,
            messageType,
            from,
            from_name,

            handleButtonReply: async (body, from) => {
              console.log(body);
              // {
              //   id: 'Achat_ticket(Soirée récréative)_22660356506',
              //   title: 'Acheter un ticket'
              // }
              if (body.title == 'Acheter un ticket') {
                const eventName = body.id.split('(')[1].split(')')[0];
                console.log(eventName);
                let typetik = await eventService.getTypeTickets(eventName);
                typetik = typetik.filter(
                  (val) =>
                    val.hiddenAfter._seconds * 1000 &&
                    Date.now() >= val.hiddenuntil._seconds * 1000,
                );

                await utils.sendListMessage(
                  from,
                  WA_PHONE_NUMBER_ID,
                  'Ticket disponible',
                  'Choissisez le type de ticket que vous voulez acheter',
                  'EASYPASS BURKINA',
                  'Voir les tickets',
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
                conversationState.step =
                  stepsEventBooking.awaiting_ticket_selection;
                conversationState.data.event = {
                  eventname: eventName,
                  tickets: typetik,
                };
                await conversationService.updateConversationState(
                  from,
                  conversationState,
                  WA_PHONE_NUMBER_ID,
                );
              }
            },
          });

          break;
        case stepsEventBooking.awaiting_ticket_selection:
          handleMesage({
            bd,
            messageType,
            from,
            from_name,

            handleListReply: async (body, from) => {
              console.log(body);
              // {
              //   id: 'ticket(Standard )_22660356506',
              //   title: 'Standard ',
              //   description: 'Standard  1000'
              // }
              const type = (
                conversationState.data.event.tickets as typeTicket[]
              ).find((ticket) => ticket.name == body.title);

              if (type.isfree) {
                const code = await eventService.createTicket(
                  conversationState.data.event.eventname,
                  type.name,
                  from,
                );
                console.log('Code ticket', code);
                // const { id } = await utils.uploadImage(
                //   `https://quickchart.io/qr?text=${code}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`,
                // );
                await utils.sendImage(
                  from,
                  WA_PHONE_NUMBER_ID,
                  `https://quickchart.io/qr?text=${code}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`,
                );
                await utils.sendText(
                  from,
                  WA_PHONE_NUMBER_ID,
                  `Il est important de garder ce code Qr car il constitue votre tikcet et sera scanner au porte de l'evenement , veuiller ne pas le partager carr chaque tikcet est unique et sera scanner dans le cas ou le ticket a ete partager il sera invalide`,
                );
                conversationState.step = stepsEventBooking.end_of_conversation;
                conversationState.data.ticket = type.name;
                await conversationService.updateConversationState(
                  from,
                  conversationState,
                  WA_PHONE_NUMBER_ID,
                );
              } else {
                await utils.sendText(
                  from,
                  WA_PHONE_NUMBER_ID,
                  `Vous avez choisi le ticket ${type.name} d'une valeur de ${type.name}, Pour terminer votre achat et recevoir votre ticket numerique vous allez devoir effectuer un depot Orange ou moov en utilisant le bouton qui suivra puis insere le numero utiliserpour faire le depot dans le formulaire qui suit`,
                );
                await utils.sendPayWithOrange(
                  from,
                  WA_PHONE_NUMBER_ID,
                  type.prix.toString(),
                );
                await sleep(5000); // Attendre 10 secondes pour le dépôt
                await utils.sendFlow(
                  '1532268067711776',
                  from,
                  'Formulaire de validation du paiment',
                  'Taper votre numero sans l indicatif ',
                  'FUTURIX PAY',
                  `FTX_PAYMENT_${type.name}_${from}_${type.prix}`,
                  WA_PHONE_NUMBER_ID,
                );
                conversationState.step =
                  stepsEventBooking.awaiting_payment_confirmation;
                conversationState.data.ticket = type.name;
                await conversationService.updateConversationState(
                  from,
                  conversationState,
                  WA_PHONE_NUMBER_ID,
                );

                // interaction.nfm_reply.push({
                //   id: `FTX_PAYMENT_${type.name}_${from}_${type.prix}_${from}`,
                //   handle: async function (data: any, from: any) {
                //     const dt = JSON.parse(data);
                //     const rs = await utils.checkPayment(
                //       dt.numero,
                //       type.prix.toString(),
                //     );
                //     console.log(rs.success);
                //     if (rs.success == true) {
                //       utils.sendText(from, 'Paiment reussie');
                //       const code = await eventService.createTicket(
                //         event.name,
                //         type.name,
                //         from,
                //       );
                //       console.log('Code ticket', code);
                //       const { id } = await utils.uploadImage(
                //         `https://quickchart.io/qr?text=${code}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`,
                //       );
                //       await utils.sendImagebyId(from, id);
                //       await utils.sendText(
                //         from,
                //         `Il est important de garder ce code Qr car il constitue votre tikcet et sera scanner au porte de l'evenement , veuiller ne pas le partager carr chaque tikcet est unique et sera scanner dans le cas ou le ticket a ete partager il sera invalide`,
                //       );
                //     } else {
                //       utils.sendText(
                //         from,
                //         'Echec de la verification du paiment , taper ( /vr ) pour reesayer',
                //       );
                //       interaction.text_reply.push({
                //         trigger: ['/vr'],
                //         handle: async function () {
                //           await utils.sendFlow(
                //             '1158395898550311',
                //             from,
                //             'Formulaire de validation du paiment',
                //             'Taper votre numero sans l indicatif ',
                //             'FUTURIX PAY',
                //             `FTX_PAYMENT_${type.name}_${from}_${type.prix}`,
                //           );
                //         },
                //       });
                //     }
                //   },
                // });
              }
            },
          });
          break;
        case stepsEventBooking.awaiting_payment_confirmation:
          handleMesage({
            bd,
            messageType,
            from,
            from_name,
            handleFlowReply: async (body, from) => {
              console.log(body);
              const dt = JSON.parse(body.response_json);
              try {
                const rs = await utils.checkPayment(
                  dt.numero,
                  (conversationState.data.event.tickets as typeTicket[])
                    .find((t) => t.name == conversationState.data.ticket)
                    .prix.toString(),
                );
                console.log(rs.success);
                if (rs.success == true) {
                  utils.sendText(from, WA_PHONE_NUMBER_ID, 'Paiment reussie');
                  const code = await eventService.createTicket(
                    conversationState.data.event.eventname,
                    conversationState.data.ticket,
                    from,
                  );
                  console.log('Code ticket', code);
                  const { id } = await utils.uploadImage(
                    `https://quickchart.io/qr?text=${code}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`,
                    WA_PHONE_NUMBER_ID,
                  );
                  await utils.sendImagebyId(from, WA_PHONE_NUMBER_ID, id);
                  await utils.sendText(
                    from,
                    WA_PHONE_NUMBER_ID,
                    `Il est important de garder ce code Qr car il constitue votre tikcet et sera scanner au porte de l'evenement , veuiller ne pas le partager carr chaque tikcet est unique et sera scanner dans le cas ou le ticket a ete partager il sera invalide`,
                  );
                  conversationState.step =
                    stepsEventBooking.end_of_conversation;
                  conversationState.data.eventticket = `https://quickchart.io/qr?text=${code}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`;
                  await conversationService.updateConversationState(
                    conversationState,
                    from,
                    WA_PHONE_NUMBER_ID,
                  );
                } else {
                  utils.sendText(
                    from,
                    WA_PHONE_NUMBER_ID,
                    'Echec de la verification du paiment , taper ( /vr ) pour reesayer ou ( /annuler ) pour annuler',
                  );
                  conversationState.step = stepsEventBooking.payement_failed;
                  await conversationService.updateConversationState(
                    from,
                    conversationState,
                    WA_PHONE_NUMBER_ID,
                  );
                }
              } catch (e) {
                utils.sendText(
                  from,
                  WA_PHONE_NUMBER_ID,
                  'Echec de la verification du paiment , taper ( /vr ) pour reesayer ou ( /annuler ) pour annuler',
                );
                conversationState.step = stepsEventBooking.payement_failed;
                await conversationService.updateConversationState(
                  from,
                  conversationState,
                  WA_PHONE_NUMBER_ID,
                );
              }
            },
          });

          break;
        case stepsEventBooking.payement_failed:
          handleMesage({
            bd,
            messageType,
            from,
            from_name,
            handleMessage: async (body, from) => {
              if (body.text.toLowerCase().includes('/vr')) {
                await utils.sendFlow(
                  '1532268067711776',
                  from,
                  'Formulaire de validation du paiment',
                  'Taper votre numero sans l indicatif ',
                  'FUTURIX PAY',
                  `FTX_PAYMENT_${conversationState.data.event.tickets.name}_${from}_${conversationState.data.event.tickets.prix}`,
                  WA_PHONE_NUMBER_ID,
                );
                conversationState.step =
                  stepsEventBooking.awaiting_payment_confirmation;
              } else if (body.text.toLowerCase().includes('/annuler')) {
                conversationState.step = stepsEventBooking.initial;
                conversationService.updateConversationState(
                  conversationState,
                  from,
                  WA_PHONE_NUMBER_ID,
                );
              }
            },
          });
          break;
      }
    } catch (e) {
      console.log('Error during ', e);
      conversationState.step = stepsEventBooking.initial;
      await conversationService.updateConversationState(
        from,
        conversationState,
        WA_PHONE_NUMBER_ID,
      );
      await utils.sendText(
        from,
        WA_PHONE_NUMBER_ID,
        'Une erreur s est produite, veuillez reessayer',
      );
      handleWebhookforEcommerce(statusCode, headers, body, response);
    }
    if (response != null) {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ status: 'success' }));
    }
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
