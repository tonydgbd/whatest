/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import * as stream from 'stream';
import { promisify } from 'util';
import { google } from 'googleapis';
const WA_BASE_URL = process.env.WA_BASE_URL || 'graph.facebook.com';
const M4D_APP_ID = process.env.M4D_APP_ID || '2398012080587850';
const M4D_APP_SECRET =
  process.env.M4D_APP_SECRET || '474f200db75856a6d418af09eaf470e7';
// const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || '243410425511216';
// const WA_BUSINESS_ACCOUNT_ID =
//   process.env.WA_BUSINESS_ACCOUNT_ID || '248885011630898';
const CLOUD_API_VERSION = process.env.CLOUD_API_VERSION || 'v20.0';
const CLOUD_API_ACCESS_TOKEN =
  process.env.CLOUD_API_ACCESS_TOKEN ||
  'EAAiEZBrI7BEoBO1tRWrbQZBNqg6YBTxTEjuGCZBRmDqRrm8Pn7OFCX9btcmyG7vUFZAfCFDy4My4tTLF1YgRn0BBXc782GrhHW0Dot2pCQZBSf61VsIM4tP9nlCEEPzsRiCHbKAna3jXZBTgKHuEdXTUbvWXjxd5ZC8qOkFGFNUrokjaZBVRKltRzXoPrPheZAses';
const WEBHOOK_ENDPOINT = process.env.WEBHOOK_ENDPOINT || 'webhook';
const WEBHOOK_VERIFICATION_TOKEN =
  process.env.WEBHOOK_VERIFICATION_TOKEN || '123456';
const LISTENER_PORT = process.env.LISTENER_PORT
  ? parseInt(process.env.LISTENER_PORT)
  : 3000;
const DEBUG = process.env.DEBUG === 'true';
const MAX_RETRIES_AFTER_WAIT = process.env.MAX_RETRIES_AFTER_WAIT
  ? parseInt(process.env.MAX_RETRIES_AFTER_WAIT)
  : 3;
const REQUEST_TIMEOUT = process.env.REQUEST_TIMEOUT
  ? parseInt(process.env.REQUEST_TIMEOUT)
  : 5000;

const pipeline = promisify(stream.pipeline);

async function uploadImage(imageUrl: string, WA_PHONE_NUMBER_ID: string) {
  const data = new FormData();

  // Télécharger l'image depuis l'URL
  const response = await axios({
    url: imageUrl,
    method: 'GET',
    responseType: 'stream',
  });

  // Créer un flux de lecture à partir de l'image téléchargée
  const imageStream = response.data;

  data.append('messaging_product', 'whatsapp');
  data.append('file', imageStream, 'image.jpg');

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://graph.facebook.com/${CLOUD_API_VERSION}/${WA_PHONE_NUMBER_ID}/media`,
    headers: {
      Authorization: 'Bearer ' + CLOUD_API_ACCESS_TOKEN,
      ...data.getHeaders(),
    },
    data: data,
  };

  const imagedata = await axios.request(config);
  return imagedata.data;
}

function requestLocation(
  messageText: string,
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'interactive',
    to: destinataire,
    interactive: {
      type: 'location_request_message',
      body: {
        text: messageText,
      },
      action: {
        name: 'send_location',
      },
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}

function sendLocation(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  latitude: string,
  longitude: string,
  name: string,
  address: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'location',
    location: {
      latitude: latitude,
      longitude: longitude,
      name: name,
      address: address,
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}
function sendImagebyId(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  id: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'image',
    image: {
      id: id,
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}
function sendImage(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  imageUrl: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'image',
    image: {
      link: imageUrl,
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}
function sendDocument(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  documentUrl: string,
  filename: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'document',
    document: {
      link: documentUrl,
      filename: filename,
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}
function sendTemplateMessage(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  templateName: string,
  languageCode: string,
  variables: any[] = [],
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: [
        {
          type: 'body',
          parameters: variables.map((variable) => ({
            type: 'text',
            text: variable,
          })),
        },
      ],
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}
function sendInteractiveProductMessage(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  catalogId: string,
  productRetailerId: string,
  optionalBodyText: string = '',
  optionalFooterText: string = '',
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'interactive',
    interactive: {
      type: 'product',
      body: {
        text: optionalBodyText,
      },
      footer: {
        text: optionalFooterText,
      },
      action: {
        catalog_id: catalogId,
        product_retailer_id: productRetailerId,
      },
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}

async function sendText(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  messageText: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'text',
    text: {
      preview_url: true,
      body: messageText,
    },
  });
  await request(data, WA_PHONE_NUMBER_ID);
}
function replyText(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  messageText: string,
  replyMessageId: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    context: {
      message_id: replyMessageId,
    },
    type: 'text',
    text: {
      preview_url: false,
      body: messageText,
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}

async function request(data: any, WA_PHONE_NUMBER_ID: string) {
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://graph.facebook.com/${CLOUD_API_VERSION}/${WA_PHONE_NUMBER_ID}/messages`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + CLOUD_API_ACCESS_TOKEN,
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      throw error;
    });
}
function sendAudio(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  audioUrl: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'audio',
    audio: {
      link: audioUrl,
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}
function sendCatalogMessage(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  bodyText: string,
  thumbnailProductRetailerId: string,
  footerText: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'interactive',
    interactive: {
      type: 'catalog_message',
      body: {
        text: bodyText,
      },
      action: {
        name: 'catalog_message',
        parameters: {
          thumbnail_product_retailer_id: thumbnailProductRetailerId,
        },
      },
      footer: {
        text: footerText,
      },
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}

function sendProductListMessage(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  headerType: string,
  headerText: string,
  bodyText: string,
  footerText: string,
  catalogId: string,
  sections: Array<{
    title: string;
    productItems: Array<{ productRetailerId: string }>;
  }>,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'interactive',
    interactive: {
      type: 'product_list',
      header: {
        type: headerType,
        text: headerText,
      },
      body: {
        text: bodyText,
      },
      footer: {
        text: footerText,
      },
      action: {
        catalog_id: catalogId,
        sections: sections.map((section) => ({
          title: section.title,
          product_items: section.productItems.map((item) => ({
            product_retailer_id: item.productRetailerId,
          })),
        })),
      },
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}

const processedWebhooks = new Set<string>();

async function handleWebhook(webhook: any) {
  const webhookId = webhook.id;

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
}
function sendProductMessage(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  bodyText: string,
  footerText: string,
  catalogId: string,
  productRetailerId: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'interactive',
    interactive: {
      type: 'product',
      body: {
        text: bodyText,
      },
      footer: {
        text: footerText,
      },
      action: {
        catalog_id: catalogId,
        product_retailer_id: productRetailerId,
      },
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}

// {
//   "type": "image",
//   "image": {
//     "id": "2762702990552401"
// }
// Text header example:
interface ImageHeader {
  type: string;
  image: {
    id?: number;
    url?: string;
    link?: string;
  };
}
interface TextHeader {
  type: 'text';
  text: string;
}
async function sendButtonMessage(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  footerText?: string,
  header?: TextHeader | ImageHeader,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'interactive',
    interactive: {
      type: 'button',
      header: header,
      body: {
        text: bodyText,
      },
      footer:
        footerText != null
          ? {
              text: footerText,
            }
          : null,
      action: {
        buttons: [
          ...buttons.map((button) => ({
            type: 'reply',
            reply: {
              id: button.id,
              title: button.title,
            },
          })),
        ],
      },
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}

async function sendListMessage(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  headerText: string,
  bodyText: string,
  footerText: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description: string }>;
  }>,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: headerText,
      },
      body: {
        text: bodyText,
      },
      footer: {
        text: footerText,
      },
      action: {
        button: buttonText,
        sections: sections.map((section) => ({
          title: section.title,
          rows: section.rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
          })),
        })),
      },
    },
  });
 await request(data, WA_PHONE_NUMBER_ID);
}
function sendVideoMessage(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  videoUrl: string,
  captionText: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'video',
    video: {
      link: videoUrl,
      caption: captionText,
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}

async function sendTemplateMessageWithFlow(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  templateName: string,
  flowId: string,
  screenName: string,
  flowTest: string,
) {
  const data = {
    recipient_type: 'individual',
    messaging_product: 'whatsapp',
    to: destinataire,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'en_US',
      },
      components: [
        {
          type: 'body',
          text: 'This is a flows as template demo',
        },
        {
          type: 'buttons',
          buttons: [
            {
              type: 'flow',
              text: flowTest,
              flow_id: flowId,
              navigate_screen: screenName,
              flow_action: 'navigate',
            },
          ],
        },
      ],
    },
  };

  request(data, WA_PHONE_NUMBER_ID);
}
async function sendFlow(
  flowId: string,
  destination: string,
  flowMessageheader: string,
  flowMessagebody: string,
  flowMessagefooter: string,
  flow_token: string,
  WA_PHONE_NUMBER_ID: string,
) {
  const data = {
    recipient_type: 'individual',
    messaging_product: 'whatsapp',
    to: destination,
    type: 'interactive',
    interactive: {
      type: 'flow',
      header: {
        type: 'text',
        text: flowMessageheader,
      },
      body: {
        text: flowMessagebody,
      },
      footer: {
        text: flowMessagefooter,
      },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: flow_token,
          flow_id: flowId,
          flow_cta: 'Pay!',
          flow_action: 'navigate',
          flow_action_payload: {
            screen: 'RECOMMEND',
          },
        },
      },
    },
  };
  request(data, WA_PHONE_NUMBER_ID);
}

async function uploadImagefromstorage(
  inagepath: string,
  WA_PHONE_NUMBER_ID: string,
) {
  const data = new FormData();
  data.append('messaging_product', 'whatsapp');
  data.append('file', fs.createReadStream(inagepath));

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://graph.facebook.com/${CLOUD_API_VERSION}/${WA_PHONE_NUMBER_ID}/media`,
    headers: {
      ...data.getHeaders(),
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}
async function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  ///maps/api/distancematrix/json?origins=51.4822656,-0.1933769&destinations=51.4994794,-0.1269979&key=<your_access_token>
  const API_URL = `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=SZhwDWCqB39zOBPLByftdXibpS6DEFKfdLa9YcDMQVbzqAl6PKJmOVgKuDUbQx6b`;
  //   {
  //     "destination_addresses": [
  //         "Westminster Abbey, London SW1P 3PA, UK"
  //     ],
  //     "origin_addresses": [
  //         "Chapel, London SW6 1BA, UK"
  //     ],
  //     "rows": [
  //         {
  //             "elements": [
  //                 {
  //                     "distance": {
  //                         "text": "7.6 km",
  //                         "value": 7567
  //                     },
  //                     "duration": {
  //                         "text": "22 mins",
  //                         "value": 1359
  //                     },
  //                     "origin": "51.4822656,-0.1933769",
  //                     "destination": "51.4994794,-0.1269979",
  //                     "status": "OK"
  //                 }
  //             ]
  //         }
  //     ],
  //     "status": "OK"
  // }

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  try {
    const rs = await axios.get(API_URL);
    console.log(rs.data);

    return rs.data.rows[0].elements[0].distance;
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: error.message,
    };
  }
}
async function checkPayment(numero: string, montant: string) {
  const data = JSON.stringify({
    api_key: '2pKOZHdl8SC-_6g4WO94nhmZD2vWfIth',
    app_id: '91e984af-9993-4aad-9005-f69156333e42',
    amount: montant,
    phonenumber: numero,
    orange: true,
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://shark-app-xeyhn.ondigitalocean.app/pay/control/phone_number',
    headers: {
      'Content-Type': 'application/json',
    },
    data: data,
  };
  try {
    console.log(data);
    const rs = await axios.request(config);
    return rs.data;
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: error.message,
    };
  }
}
async function sendCallToAction(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  bodyText: string,
  footerText: string,
  callToActionText: string,
  link: string,
  linkname: string,
  headerText?: string,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'interactive',
    interactive: {
      type: 'cta_url',

      /* Header optional */
      header: headerText
        ? {
            type: 'text',
            text: headerText,
          }
        : null,

      /* Body optional */
      body: {
        text: bodyText,
      },

      /* Footer optional */
      footer: {
        text: footerText,
      },
      action: {
        name: linkname,
        parameters: {
          display_text: callToActionText,
          url: link,
        },
      },
    },
  });
  request(data, WA_PHONE_NUMBER_ID);
}
async function sendPayWithOrange(
  destinataire: string,
  WA_PHONE_NUMBER_ID: string,
  montantText: string,
) {
  await sendCallToAction(
    destinataire,
    WA_PHONE_NUMBER_ID,
    'Payez via Orange Money',
    'securise et rapide',
    'Lancer le paiement',
    'tel:*144*10*05690560*' + montantText + '#',
    'cta_url',
  );
}

async function getSheetData() {
  /**
   * Gets cell values from a Spreadsheet.
   * @param {string} spreadsheetId The spreadsheet ID.
   * @param {string} range The sheet range.
   * @return {obj} spreadsheet information
   */
  // const auth = new GoogleAuth({
  //   scopes: 'https://www.googleapis.com/auth/spreadsheets',
  // });

  const service = google.sheets({
    version: 'v4',
    auth: 'AIzaSyCCJR3i90PluxHX-NNn7Wp8WAg-o2ETlFw',
  });
  try {
    const result = await service.spreadsheets.values.get({
      spreadsheetId: '18LqtF3o5V8OASnB4qsQ048Y7f51k0psM8PKSNqVu0dU',
      range: '5:5',
    });

    const numRows = result.data.values ? result.data.values.length : 0;
    console.log(`${numRows} rows retrieved.`);
    console.log(result.data.values);
    return result;
  } catch (err) {
    // TODO (developer) - Handle exception
    throw err;
  }
}

// function sendCarouselMessage(
//   destinataire: string,
//   WA_PHONE_NUMBER_ID: string,
//   templateName: string,
//   languageCode: string,
//   category: string,
//   bubbleText: string,
//   bubbleTextVarExample: string[],
//   cards: {
//     headerFormat: string;
//     headerHandle: string;
//     bodyText: string;
//     bodyTextVarExample: string[];
//     quickReplyButtonText: string;
//     urlButtonText: string;
//     urlButtonUrl: string;
//     urlButtonVarExample: string;
//   }[],
// ) {
//   const data = JSON.stringify({
//     name: 'summer_carousel_promo_2023',
//     language: 'en_US',
//     category: 'MARKETING',
//     components: [
//       {
//         type: 'BODY',
//         text: 'Summer is here, and we have the freshest produce around! Use code {{1}} to get {{2}} off your next order.',
//         example: {
//           body_text: [['15OFF', '15%']],
//         },
//       },
//       {
//         type: 'CAROUSEL',
//         cards: [
//           {
//             components: [
//               {
//                 type: 'HEADER',
//                 format: 'IMAGE',
//                 example: {
//                   header_handle: ['4::aW...'],
//                 },
//               },
//               {
//                 type: 'BODY',
//                 text: 'Rare lemons for unique cocktails. Use code {{1}} to get {{2}} off all produce.',
//                 example: {
//                   body_text: [['15OFF', '15%']],
//                 },
//               },
//               {
//                 type: 'BUTTONS',
//                 buttons: [
//                   {
//                     type: 'QUICK_REPLY',
//                     text: 'Send more like this',
//                   },
//                   {
//                     type: 'URL',
//                     text: 'Buy now',
//                     url: 'https://www.luckyshrub.com/shop?promo={{1}}',
//                     example: [
//                       'https://www.luckyshrub.com/shop?promo=summer_lemons_2023',
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//           {
//             components: [
//               {
//                 type: 'HEADER',
//                 format: 'IMAGE',
//                 example: {
//                   header_handle: ['4::aW...'],
//                 },
//               },
//               {
//                 type: 'BODY',
//                 text: 'Exotic fruit for unique cocktails! Use code {{1}} to get {{2}} off all exotic produce.',
//                 example: {
//                   body_text: [['20OFFEXOTIC', '20%']],
//                 },
//               },
//               {
//                 type: 'BUTTONS',
//                 buttons: [
//                   {
//                     type: 'QUICK_REPLY',
//                     text: 'Send more like this',
//                   },
//                   {
//                     type: 'URL',
//                     text: 'Buy now',
//                     url: 'https://www.luckyshrub.com/shop?promo={{1}}',
//                     example: [
//                       'https://www.luckyshrub.com/shop?promo=exotic_produce_2023',
//                     ],
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//       },
//     ],
//   });
//   const config = {
//     method: 'post',
//     maxBodyLength: Infinity,
//     url: `https://graph.facebook.com/${CLOUD_API_VERSION}/${WA_BUSINESS_ACCOUNT_ID}/message_templates`,
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: 'Bearer ' + CLOUD_API_ACCESS_TOKEN,
//     },
//     data: data,
//   };

//   axios
//     .request(config)
//     .then((response) => {
//       return response;
//     })
//     .catch((error) => {
//       throw error;
//     });
// }
export default {
  // sendCarouselMessage,
  getSheetData,
  sendPayWithOrange,
  sendInteractiveProductMessage,
  sendAudio,
  sendCatalogMessage,
  sendProductListMessage,
  checkPayment,
  requestLocation,
  sendLocation,
  sendTemplateMessage,
  sendDocument,
  sendImage,
  sendText,
  replyText,
  sendProductMessage,
  sendButtonMessage,
  sendListMessage,
  sendVideoMessage,
  sendTemplateMessageWithFlow,
  sendFlow,
  sendCallToAction,
  uploadImagefromstorage,
  uploadImage,
  getDistance,
  sendImagebyId,
};
