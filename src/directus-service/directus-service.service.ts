import {
  authentication,
  createDirectus,
  createItem,
  createItems,
  readItem,
  readItems,
  rest,
  staticToken,
} from '@directus/sdk';
import { Injectable } from '@nestjs/common';
import * as request from 'supertest';
interface Product {
  id: string;
  user_created: string;
  date_created: string;
  user_updated: string | null;
  date_updated: string | null;
  total: number;
  numero_destinataire: string;
  point_de_livraison: {
    type: string;
    coordinates: [number, number];
  };
  adresse_google_map: string | null;
  details: number;
}

interface OrderDetail {
  id: number;
  user_created: string;
  date_created: string;
  user_updated: string | null;
  date_updated: string | null;
  product: number;
  quantity: number;
  sous_total: number;
}
type OrderData = {
  step: number;
  data: {
    order: {
      catalog_id: string;
      text: '';
      product_items: [
        {
          product_retailer_id: string;
          quantity: number;
          item_price: number;
          currency: string;
        },
      ];
    };
    location: { latitude: number; longitude: number };
  };
  total: number;
};

@Injectable()
export class DirectusServiceService {
  directus: any;
  constructor() {
    // Initialize Directus API
    this.init();
  }
  async init() {
    this.directus = createDirectus('http://127.0.0.1:8055')
      .with(authentication())
      .with(staticToken(process.env.Directus_api_key))
      .with(rest());
    // Vérification de la clé API
    try {
      await this.directus.setToken(process.env.Directus_api_key);
      //   await this.directus.request(readItems<Product, any, any>(`Products`)); // Pass the 'Product' interface as the type parameter
    } catch (error) {
      throw new Error(error.message);
    }
  }
  //   {"data":[{"id":"78e99ee2-3624-4a33-84c7-235ebd0774ed","user_created":"da4eefc5-7609-4ea4-9230-8ff63bcd60fc","date_created":"2024-08-05T18:39:07.322Z","user_updated":null,"date_updated":null,"total":123456,"numero_destinataire":"4567898765","point_de_livraison":{"type":"Point","coordinates":[-1.578119525787457,12.405334427366071]},"adresse_google_map":null,"details":1}]}
  async createOrder(data: OrderData, from: string, Wa: string) {
    //{"id":1,"user_created":"da4eefc5-7609-4ea4-9230-8ff63bcd60fc","date_created":"2024-08-05T18:39:07.312Z","user_updated":null,"date_updated":null,"product":1,"quantity":1234,"sous_total":2345678}
    try {
      const compte = await this.directus.request(
        readItems<any, any, any>('Commerce', {
          filter: {
            WA_PHONE_NUMBER_ID: {
              _eq: Wa,
            },
          },
        }),
      );
      console.log(compte);
      const details = await this.directus.request(
        createItems<OrderDetail, any, any>(`detail_commande`, [
          ...data.data.order.product_items.map((item) => ({
            product: '1',
            quantity: item.quantity,
            sous_total: item.item_price * item.quantity,
          })),
        ]),
      );
      const ids = [];
      details.forEach((detail) => {
        ids.push(detail.id);
      });

      console.log(ids);
      //create order
      const order = await this.directus.request(
        createItem<any, any, any>(`Commande`, {
          total: data.total,
          numero_destinataire: from,
          compte: compte[0].id,
          point_de_livraison: {
            type: 'Point',
            coordinates: [
              data.data.location.latitude,
              data.data.location.longitude,
            ],
          },
          adresse_google_map: `https://www.google.com/maps/search/?api=1&query=${data.data.location.latitude},${data.data.location.longitude}`,
          // details: ids,
        }),
      );
      //linking
      ids.forEach(async (id) => {
        await this.directus.request(
          createItem<any, any, any>(`Commande_detail_commande`, {
            Commande_id: order.id,
            detail_commande_id: id,
          }),
        );
      });

      console.log(order);
      return order;
    } catch (err) {
      console.log(err);
      throw new Error(err.message);
    }
  }
}
