import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';
@Injectable()
export class ConversationStateService {
  redisClient = createClient({
    url: 'redis://default:ZyCjq3OCl8WwyA907VYeUEnKSqumFrRS@redis-16687.c253.us-central1-1.gce.redns.redis-cloud.com:16687',
  });

  constructor() {
    this.redisClient.on('error', (err) =>
      console.log('Redis Client Error', err),
    );

    (async () => {
      await this.redisClient.connect();
    })();
  }
  async getConversationState(userId: string, Whatsapp_ph_id: string) {
    const state = await this.redisClient.get(userId + '_' + Whatsapp_ph_id);
    return state ? JSON.parse(state) : null;
  }
  async updateConversationState(
    userId: string,
    state: any,
    Whatsapp_ph_id: string,
  ) {
    await this.redisClient.set(
      userId + '_' + Whatsapp_ph_id,
      JSON.stringify(state),
      {
        "EXAT": Date.now() + 24 * 60 * 60 * 1000,
      }
    );
  }
}
