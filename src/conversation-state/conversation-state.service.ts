import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';
@Injectable()
export class ConversationStateService {
  redisClient = createClient({
    url: 'redis://:gJgr6oX2lj5junp69RUR9iaRBwuibhdNatdIqkBZuhOftMjfwbFFz4HyGejUAD74@142.93.194.86:5432/0',
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
