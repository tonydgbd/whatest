import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';
@Injectable()
export class ConversationStateService {
  redisClient = createClient({
    url: 'redis://default:Kingdgbd226@142.93.194.86:6379',
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
    );
  }
}
