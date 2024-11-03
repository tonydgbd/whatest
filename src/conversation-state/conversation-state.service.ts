import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class ConversationStateService implements OnModuleInit, OnModuleDestroy {
  private static redisClient: RedisClientType;

  constructor() {
    if (!ConversationStateService.redisClient) {
      ConversationStateService.redisClient = createClient({
        url: process.env.Redis_URL,
      });

      ConversationStateService.redisClient.on('error', (err) =>
        console.log('Redis Client Error', err),
      );
    }
  }

  async onModuleInit() {
    if (!ConversationStateService.redisClient.isOpen) {
      await ConversationStateService.redisClient.connect();
    }
  }

  async onModuleDestroy() {
    if (ConversationStateService.redisClient.isOpen) {
      await ConversationStateService.redisClient.quit();
    }
  }

  async getConversationState(userId: string, Whatsapp_ph_id: string) {
    const state = await ConversationStateService.redisClient.get(userId + '_' + Whatsapp_ph_id);
    return state ? JSON.parse(state) : null;
  }

  async updateConversationState(userId: string, state: any, Whatsapp_ph_id: string) {
    await ConversationStateService.redisClient.set(
      userId + '_' + Whatsapp_ph_id,
      JSON.stringify(state),
      {
        EXAT: Date.now() + 24 * 60 * 60 * 1000,
      },
    );
  }
}