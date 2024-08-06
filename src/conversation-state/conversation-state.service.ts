import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';
@Injectable()
export class ConversationStateService {
  redisClient = createClient();

  constructor() {
    this.redisClient.on('error', (err) =>
      console.log('Redis Client Error', err),
    );

    (async () => {
      await this.redisClient.connect();
    })();
  }
  async getConversationState(userId: string) {
    const state = await this.redisClient.get(userId);
    return state ? JSON.parse(state) : null;
  }
  async updateConversationState(userId: string, state: any) {
    await this.redisClient.set(userId, JSON.stringify(state));
  }
}
