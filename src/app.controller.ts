import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  Headers
} from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express'; // Import IncomingHttpHeaders from express module
import utils from './utils';
import { GoogleSheetService } from './google-sheet/google-sheet.service';
import { DirectusServiceService } from './directus-service/directus-service.service';
import * as crypto from 'crypto';
import { IncomingHttpHeaders, ServerResponse } from 'http';
import { sleep } from '@directus/sdk';
import { ConversationStateService } from './conversation-state/conversation-state.service';
import { WebhookObject } from 'whatsapp/build/types/webhooks';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private googleSheetService: GoogleSheetService,
    private directusServiceService: DirectusServiceService,
  ) {
    this.googleSheetService = new GoogleSheetService();
  }
  @Get('/webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    console.log('webhook subscription request received');
    // Verify the webhook subscription request
    console.log('mode:', mode);
    console.log('verifyToken:', verifyToken);
    console.log('challenge:', challenge);
    if (mode === 'subscribe' && verifyToken === '123456') {
       res.status(HttpStatus.OK).send(challenge);
      console.log(`webhook subscription request successfully verified`);
    } else {
      const errorMessage = `webhook subscription request has either missing or non-matching verify token`;
      console.log(errorMessage);
      res.status(HttpStatus.OK).send(challenge);

    }
  }

  @Post('/webhook')
  async handleWebhook(
    @Headers('x-hub-signature-256') xHubSignatureHeader: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (xHubSignatureHeader) {
      console.log(process.env.M4D_APP_SECRET);
      const xHubSignature = xHubSignatureHeader.replace('sha256=', '');
      console.log('x-hub-signature-header', xHubSignature);
    
      const generatedSignature = generateXHub256Sig(
        body.toString(),
        process.env.M4D_APP_SECRET,
      );
      console.log('generatedSignature:', generatedSignature);

      // if (generatedSignature != xHubSignature) {
      //   console.log('x-hub-signature-256 header matches generated signature');
       await  handleWebhookforEcommerce(200,req.headers,req.body,res);
      // } else {
      //   const errorMessage = "error: x-hub signature doesn't match";
      //   console.log(errorMessage);
      //   res.status(HttpStatus.UNAUTHORIZED).send(errorMessage);
      // }
    } else {
      const errorMessage = "error: missing x-hub-signature-256 header";
      console.log(errorMessage);
      res.status(HttpStatus.BAD_REQUEST).send(errorMessage);
    }
  }

 
  @Post('/delete-row')
  async deleteRow(
    @Body() body: { sheetName: string; id: string; spreadsheetId: string },
  ) {
    const { sheetName, id, spreadsheetId } = body;
    await this.googleSheetService.deleteRowById(
      sheetName,
      'id',
      id,
      spreadsheetId,
    );
    return { message: 'Row deleted successfully' };
  }

  @Post('/update-row')
  async updateRow(
    @Body()
    body: {
      sheetName: string;
      rowData: any;
      id: string;

      spreadsheetId: string;
    },
  ) {
    const { sheetName, rowData, id, spreadsheetId } = body;
    await this.googleSheetService.updateRowFromDictionary(
      sheetName,
      spreadsheetId,
      rowData,
      'id',
      id,
    );
    return { message: 'Row updated successfully' };
  }
  @Post('/add-row')
  async addRow(
    @Body() body: { sheetName: string; rowData: any; spreadsheetId: string },
  ) {
    const { sheetName, spreadsheetId, rowData } = body;
    await this.googleSheetService.addRowFromDictionary(
      sheetName,
      spreadsheetId,
      rowData,
    );
    return { message: 'Row added successfully' };
  }
}

function generateXHub256Sig (body: string, appSecret: string) {
	return crypto
		.createHmac('sha256', appSecret)
		.update(body, 'utf-8')
		.digest('hex');
}

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
const eventService = new AppService();

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
  body: string;
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
  handleText?: HandleMessageCllBack;
};
function handleMesage(HandleMessageFunction: HandleMessageFunction) {
  
  switch (HandleMessageFunction.messageType) {
    case 'interactive':
      const interactiveType =
        HandleMessageFunction.bd?.entry?.[0]?.changes?.[0]?.['value']?.['messages']?.[0]?.[
          'interactive'
        ]?.['type'];
      if (interactiveType === 'nfm_reply') {
        console.log('Handling nfm reply');
        if (HandleMessageFunction.handleFlowReply == null) {
          throw Error('handleFlowReply is not defined');
        }
        HandleMessageFunction.handleFlowReply(
          HandleMessageFunction.bd.entry[0].changes[0]['value']['messages'][0][
            'interactive'
          ]['nfm_reply'],
          HandleMessageFunction.from,
        );
      } else if (interactiveType === 'button_reply') {
        if (HandleMessageFunction.handleButtonReply == null) {
          throw Error('handleButtonReply is not defined');
        }
        HandleMessageFunction.handleButtonReply(
          HandleMessageFunction.bd.entry[0].changes[0]['value']['messages'][0][
            'interactive'
          ]['button_reply'],
          HandleMessageFunction.from,
        );
      } else if (interactiveType === 'list_reply') {
        if (HandleMessageFunction.handleListReply == null) {
          throw Error('handleListReply is not defined');
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
        throw Error('handleOrder is not defined');
      }

      HandleMessageFunction.handleOrder(
        HandleMessageFunction.bd.entry[0].changes[0]['value']['messages'][0][
          'order'
        ],
        HandleMessageFunction.from,
      );
      break;
    case 'text':
      if (HandleMessageFunction.handleText == null) {
        throw Error('handleMessage is not defined');
      }
      console.log('Handling message');
      HandleMessageFunction.handleText(
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
        throw Error('handleLocation is not defined');
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
  isAReapet?: boolean,
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
    awaiting_payment_confirmation,
    end_of_conversation,
    payement_failed,
  }
  console.log(JSON.stringify(body));

  const conversationService = new ConversationStateService();

  const bd = JSON.parse(JSON.stringify(body));
  if (bd.entry[0].changes[0].value.messages == undefined) {
    console.log('No message in webhook');
    try {
      if (response != null) {
        await response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'success' }));
        return ;
      }
    } catch (e) {}
  }
  const from = bd.entry[0].changes[0].value.messages[0].from;
  const messageType = bd.entry[0].changes[0].value.messages[0].type;
  const from_name = bd.entry[0].changes[0].value.contacts[0].profile.name;
  const WA_PHONE_NUMBER_ID =bd.entry[0].changes[0].value.metadata.phone_number_id;
  console.log(`Received message from ${from} of type ${messageType}`);
  // Récupérer l'état de la conversation de l'utilisateur
  // eslint-disable-next-line no-var
  // if (WA_PHONE_NUMBER_ID == '243410425511216') {
  //   let conversationState = await conversationService.getConversationState(
  //     from,
  //     WA_PHONE_NUMBER_ID,
  //   );
  //   console.log(conversationState);
  //   if (!conversationState) {
  //     conversationState = { step: steps.initial, data: {} };
  //   }
  //   try {
  //     // Logique de traitement basée sur l'état de la conversation
  //     switch (conversationState.step) {
  //       case steps.initial:
  //         // Récupérer le message de démarrage de l'utilisateur
  //         await utils.sendText(
  //           from,
  //           WA_PHONE_NUMBER_ID,
  //           `Bonjour ${from_name} je suis l'assistant de commande`,
  //         );
  //         await utils.sendText(
  //           from,
  //           WA_PHONE_NUMBER_ID,
  //           `ci dessous les produits disponibles , veuillez faire votre choix et placer la commande`,
  //         );
  //         await utils.sendCatalogMessage(
  //           from,
  //           WA_PHONE_NUMBER_ID,
  //           'Produit disponible ',
  //           'DikMJQdsD6KWbAWSTKM2Gz',
  //           '1',
  //         );
  //         conversationState.step = steps.awaiting_order_message;
  //         break;
  //       case steps.first_message_send:
  //         // Récupérer la réponse de l'utilisateur
  //         conversationState.step = steps.awaiting_order_message;
  //         break;
  //       case steps.awaiting_order_message:
  //         // Récupérer la réponse de l'utilisateur
  //         console.log(body);
  //         handleMesage({
  //           bd,
  //           messageType,
  //           from,
  //           from_name,
  //           handleOrder: async (body: any, from: any) => {
  //             console.log('Handling order message');
  //             console.log(body);
  //             let total = 0;
  //             body.product_items.forEach((item) => {
  //               total += item.item_price * item.quantity;
  //             });
  //             console.log(`Total : ${total} XOF`);
  //             const data = {
  //               order: body,
  //             };
  //             await utils.requestLocation(
  //               'Cliquez sur le bouton ci-dessous pour partager votre localisation ',
  //               from,
  //               WA_PHONE_NUMBER_ID,
  //             );
  //             conversationState.step = steps.awaiting_location;
  //             conversationState.data = data;
  //             await conversationService.updateConversationState(
  //               from,
  //               conversationState,
  //               WA_PHONE_NUMBER_ID,
  //             );
  //           },
  //         });
  //         break;
  //       case steps.awaiting_location:
  //         // Récupérer la réponse de l'utilisateur
  //         if (messageType != 'location') {
  //           if (response != null) {
  //             response.writeHead(200, { 'Content-Type': 'application/json' });
  //             response.end(JSON.stringify({ status: 'success' }));
  //           }
  //           return;
  //         }
  //         handleMesage({
  //           bd,
  //           messageType,
  //           from,
  //           from_name,
  //           handleLocation: async (body, from) => {
  //             console.log(body);
  //             conversationState.step = steps.awaiting_payment_method;
  //             conversationState.data.location = body;
  //             await conversationService.updateConversationState(
  //               from,
  //               conversationState,
  //               WA_PHONE_NUMBER_ID,
  //             );
  //             await utils.sendText(
  //               from,
  //               WA_PHONE_NUMBER_ID,
  //               `Votre localisation a été enregistrée avec succès`,
  //             );
  //             await utils.sendText(
  //               from,
  //               WA_PHONE_NUMBER_ID,
  //               `Pour terminer votre achat et recevoir votre ticket numerique vous allez devoir effectuer un depot Orange ou moov en utilisant le bouton qui suivra puis insere le numero utiliser pour faire le depot dans le formulaire qui suit`,
  //             );
  //             let total = 0;
  //             conversationState.data.order.product_items.forEach((item) => {
  //               total += item.item_price * item.quantity;
  //             });
  //             await utils.sendPayWithOrange(
  //               from,
  //               WA_PHONE_NUMBER_ID,
  //               total.toString(),
  //             );
  //             await sleep(5000); // Attendre 10 secondes pour le dépôt
  //             await utils.sendFlow(
  //               '1158395898550311',
  //               from,
  //               'Formulaire de confirmation du paiement',
  //               'Taper votre numero sans l indicatif ',
  //               'FUTURIX PAY',
  //               `FTX_PAYMENT_${conversationState.data.order.catalog_id}_${from}_${total}`,
  //               WA_PHONE_NUMBER_ID,
  //             );
  //             conversationState.step = steps.awaiting_payment_confirmation;
  //             conversationState.total = total;
  //             await conversationService.updateConversationState(
  //               from,
  //               conversationState,
  //               WA_PHONE_NUMBER_ID,
  //             );
  //           },
  //         });
  //         break;
  //       case steps.awaiting_payment_confirmation:
  //         // Récupérer la réponse de l'utilisateur a flow
  //         handleMesage({
  //           bd,
  //           messageType,
  //           from,
  //           from_name,
  //           handleFlowReply: async (body: any, from: any) => {
  //             const directusService = new DirectusServiceService();
  //             console.log(body);
  //             const dt = JSON.parse(body.response_json);
  //             const isorange: boolean = dt.reseau == '0_ORANGE_Money';
  //             const rs = await utils.checkPayment(
  //               dt.numero,
  //               conversationState.total.toString(),
  //               isorange,
  //             );
  //             console.log(rs.success);
  //             if (true) {
  //               //register order
  //               directusService.createOrder(
  //                 conversationState,
  //                 from,
  //                 WA_PHONE_NUMBER_ID,
  //               );
  //               await utils.sendText(
  //                 from,
  //                 WA_PHONE_NUMBER_ID,

  //                 `Votre commande a été enregistrée avec succès`,
  //               );
  //               conversationState.step = steps.end_of_conversation;
  //               await conversationService.updateConversationState(
  //                 from,
  //                 conversationState,
  //                 WA_PHONE_NUMBER_ID,
  //               );
  //             } else {
  //               //handle order gdasza hfzavfewaadzcff1  23454655qwe7]0875432``1223r69-b
  //             }
  //           },
  //         });
  //         break;
  //       case steps.awaiting_payment_confirmation:
  //         // Récupérer la réponse de l'utilisateur
  //         conversationState.step = steps.end_of_conversation;
  //         break;
  //       case steps.end_of_conversation:
  //         // Récupérer la réponse de l'utilisateur
  //         conversationState.step = steps.end_of_conversation;
  //     }
  //   } catch (e) {
  //     console.log('Error during ', e);
  //     conversationState.step = steps.initial;
  //     await conversationService.updateConversationState(
  //       from,
  //       conversationState,
  //       WA_PHONE_NUMBER_ID,
  //     );
  //     await utils.sendText(
  //       from,
  //       WA_PHONE_NUMBER_ID,
  //       'Cette reponse n\est pas valide, veuillez reessayer',
  //     );
  //     handleWebhookforEcommerce(statusCode, headers, body, response);
  //   }

  //   // Mettre à jour l'état de la conversation de l'utilisateur
  //   await conversationService.updateConversationState(
  //     from,
  //     conversationState,
  //     WA_PHONE_NUMBER_ID,
  //   );
  // } else 
  if (WA_PHONE_NUMBER_ID == '378202835367658') {
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
            `Bonjour ${from_name} Bienvue sur le service Billeterie de EasyPass Burkina `,
          );
          await sleep(1000);

          // Si vous avez besoin de mettre à jour l'array original
          let responseText = `Voici les prochains évènements à venir:\n`;
          events.forEach((event) => {
            responseText += `- ${event.name}\n`;
          });
          console.log(responseText);
          await utils.sendText(from, WA_PHONE_NUMBER_ID, responseText);
          const promises = events.map(async (event) => {
            console.log("Case of ", event.name);
            const bodymsg = `${event.name} \n ${event.description}  \nDate debut: ${new Date(event.startDate._seconds * 1000).toLocaleDateString()} \nDate de fin: ${new Date(event.endDate._seconds * 1000).toLocaleDateString()} \n Lieu :${event.nomLieu}`;
            return utils.sendButtonMessage(
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
          await Promise.all(promises);
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

              if (body.title == 'Acheter un ticket') {
                const eventName = body.id.split('(')[1].split(')')[0];
                console.log(eventName);
                let typetik = await eventService.getTypeTickets(eventName);
                console.log('avant filter');
                console.log(typetik)

                typetik = typetik.filter(
                  (val) =>
                    val.hiddenAfter._seconds > Date.now()/1000
                ).filter((va)=> va.hiddenuntil._seconds < Date.now()/1000);
                console
                .log("apres filter ")
                console.log(typetik)

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
                  null,
                  WA_PHONE_NUMBER_ID
                );
                console.log('Code ticket', code);
                // const { id } = await utils.uploadImage(
                //   `https://quickchart.io/qr?text=${code}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`,
                // );
                await utils.sendImage(
                  from,
                  WA_PHONE_NUMBER_ID,
                  `https://quickchart.io/qr?text=${code}&caption=EASYPASS_TICKET&captionFontFamily=mono&captionFontSize=20`,
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
                await utils.sendPayWithMoov(
                  from,
                  WA_PHONE_NUMBER_ID,
                  type.prix.toString(),
                );
                await sleep(5000); // Attendre 10 secondes pour le dépôt
                await utils.sendFlow(
                  '1250969692781092',
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
              const codeparrain = dt.parrain;
              const isorange: boolean = dt.reseau == '0_ORANGE_Money';
              try {
                const rs = await utils.checkPayment(
                  dt.numero,
                  (conversationState.data.event.tickets as typeTicket[])
                    .find((t) => t.name == conversationState.data.ticket)
                    .prix.toString(),
                  isorange,
                );
                console.log(rs);
                if (rs.success == true) {
                  try{
                  await utils.sendText(from, WA_PHONE_NUMBER_ID, 'Paiment reussie');
                  console.log('params', conversationState.data.event.eventname, conversationState.data.ticket, from, codeparrain, WA_PHONE_NUMBER_ID);
                  const code = await eventService.createTicket(
                    conversationState.data.event.eventname,
                    conversationState.data.ticket,
                    from,
                    codeparrain,
                    WA_PHONE_NUMBER_ID
                  );
                  console.log('Code ticket', code);
                  // const { id } = await utils.uploadImage(
                  //   `https://quickchart.io/qr?text=${code}&ecLevel=H&margin=2&size=500&centerImageUrl=https%3A%2F%2Feasypass-bf.com%2Fimages%2Fupload%2F667c2fb052d3e.png`,
                  //   WA_PHONE_NUMBER_ID,
                  // );
                  await utils.sendImage(from, WA_PHONE_NUMBER_ID, `https://quickchart.io/qr?text=${code}&caption=EASYPASS_TICKET&captionFontFamily=mono&captionFontSize=20`);
                  await utils.sendText(from , WA_PHONE_NUMBER_ID, `https://quickchart.io/qr?text=${code}&caption=EASYPASS_TICKET&captionFontFamily=mono&captionFontSize=20`);
                  await utils.sendText(
                    from,
                    WA_PHONE_NUMBER_ID,
                    `Il est important de garder ce code Qr car il constitue votre tikcet et sera scanner au porte de l'evenement , veuiller ne pas le partager carr chaque tikcet est unique et sera scanner dans le cas ou le ticket a ete partager il sera invalide`,
                  );
                  conversationState.step = stepsEventBooking.initial;
                  conversationState.data.eventticket = `https://quickchart.io/qr?text=${code}&caption=EASYPASS_TICKET&captionFontFamily=mono&captionFontSize=20`;
                  await utils.sendText(
                    from,
                    WA_PHONE_NUMBER_ID,
                    `Merci d'avoir fait confiance a EasyPass, Bonne Continuation !! `,
                  );
                  await conversationService.updateConversationState(
                    conversationState,
                    from,
                    WA_PHONE_NUMBER_ID,
                  );}
                  catch(e){
                    console.log('err' + e);
                  }
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
            handleText: async (body, from) => {
              console.log(body);
              if (body.body.toLowerCase().includes('/vr')) {
                await utils.sendFlow(
                  '1250969692781092',
                  from,
                  'Formulaire de validation du paiment',
                  'Taper votre numero sans l indicatif ',
                  'FUTURIX PAY',
                  `FTX_PAYMENT_${conversationState.data.event.tickets.name}_${from}_${conversationState.data.event.tickets.prix}`,
                  WA_PHONE_NUMBER_ID,
                );
                conversationState.step =
                  stepsEventBooking.awaiting_payment_confirmation;
                await conversationService.updateConversationState(
                  from,
                  conversationState,
                  WA_PHONE_NUMBER_ID,
                );
              } else if (body.body.toLowerCase().includes('/annuler')) {
                conversationState.step = stepsEventBooking.initial;
                await conversationService.updateConversationState(
                  from,
                  conversationState,

                  WA_PHONE_NUMBER_ID,
                );
              }
            },
          });
          break;
        case stepsEventBooking.end_of_conversation:
          conversationState.step = stepsEventBooking.initial;
          await conversationService.updateConversationState(
            from,
            conversationState,
            WA_PHONE_NUMBER_ID,
          );
          await utils.sendText(
            from,
            WA_PHONE_NUMBER_ID,
            'Merci d avoir fait confiance a EasyPass, Bonne Continuation !! ',
          );
          break;
          default:
            console.log('Unhandled message step: ', conversationState.step);
            conversationState.step = stepsEventBooking.initial;
            await conversationService.updateConversationState(
              from,
              conversationState,
              WA_PHONE_NUMBER_ID,
            );
            if(isAReapet != true){
              handleWebhookforEcommerce(statusCode, headers, body, response, true);
            }
        
        }
       
    } catch (e) {
      console.log('Error during ', e);
      conversationState.step = conversationState.step;
        conversationState.step = stepsEventBooking.initial;
        await conversationService.updateConversationState(
          from,
          conversationState,
          WA_PHONE_NUMBER_ID,
        );
      await utils.sendText(
        from,
        WA_PHONE_NUMBER_ID,
        "D\'esol\'e, je n'ai pas compris votre message. Pouvez-vous me le r\'ep\'eter s'il vous plaît ?",
      );
      if(isAReapet != true){
        handleWebhookforEcommerce(statusCode, headers, body, response, true);
      }
    }
    try {
      if (response != null) {
        await response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'success' }));
      }
    } catch (e) {}
  }
}
