import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoogleSheetService } from './google-sheet/google-sheet.service';
import { ConversationStateService } from './conversation-state/conversation-state.service';
import { DirectusServiceService } from './directus-service/directus-service.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, GoogleSheetService, ConversationStateService, DirectusServiceService],
})
export class AppModule {}
