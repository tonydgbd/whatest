/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios';

const WA_BASE_URL = process.env.WA_BASE_URL || 'graph.facebook.com';
const M4D_APP_ID = process.env.M4D_APP_ID || '2398012080587850';
const M4D_APP_SECRET =
  process.env.M4D_APP_SECRET || '474f200db75856a6d418af09eaf470e7';
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || '243410425511216';
const WA_BUSINESS_ACCOUNT_ID =
  process.env.WA_BUSINESS_ACCOUNT_ID || '248885011630898';
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

function requestLocation(messageText: string, destinataire: string) {
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
  request(data);
}

function sendLocation(
  destinataire: string,
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
  request(data);
}
function sendImage(
  destinataire: string,
  imageUrl: string,
  caption: string = '',
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'image',
    image: {
      link: imageUrl,
      caption: caption,
    },
  });
  request(data);
}
function sendDocument(
  destinataire: string,
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
  request(data);
}
function sendTemplateMessage(
  destinataire: string,
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
  request(data);
}
function sendInteractiveProductMessage(
  destinataire: string,
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
  request(data);
}

function sendText(destinataire: string, messageText: string) {
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
  request(data);
}
function replyText(
  destinataire: string,
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
  request(data);
}

function request(data: any) {
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
function sendAudio(destinataire: string, audioUrl: string) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'audio',
    audio: {
      link: audioUrl,
    },
  });
  request(data);
}
function sendCatalogMessage(
  destinataire: string,
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
  request(data);
}

function sendProductListMessage(
  destinataire: string,
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
  request(data);
}
function sendProductMessage(
  destinataire: string,
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
  request(data);
}

function sendButtonMessage(
  destinataire: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
) {
  const data = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destinataire,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText,
      },
      action: {
        buttons: buttons.map((button) => ({
          type: 'reply',
          reply: {
            id: button.id,
            title: button.title,
          },
        })),
      },
    },
  });
  request(data);
}

function sendListMessage(
  destinataire: string,
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
  request(data);
}
function sendVideoMessage(
  destinataire: string,
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
  request(data);
}

async function sendTemplateMessageWithFlow(
  destinataire: string,
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

  request(data);
}

export default {
  requestLocation,
  sendLocation,
  sendTemplateMessage,
  sendDocument,
  sendImage,
  sendText,
  replyText,
  sendInteractiveProductMessage,
  sendAudio,
  sendCatalogMessage,
  sendProductListMessage,
  sendProductMessage,
  sendButtonMessage,
  sendListMessage,
  sendVideoMessage,
};
