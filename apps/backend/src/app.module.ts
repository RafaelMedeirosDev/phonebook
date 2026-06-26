import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentController } from 'src/controller/AgentController';
import { ContactController } from 'src/controller/ContactController';
import { ContactRepository } from 'src/domain/ContactRepository';
import { PrismaContactRepository } from 'src/external/repositories/remote/PrismaContactRepository';
import { PrismaRemoteRepository } from 'src/external/repositories/remote/PrismaRemoteRepository';
import { OpenAIProvider } from 'src/provider/OpenAIProvider';
import { AgentService } from 'src/service/AgentService';
import { CreateContactService } from 'src/service/CreateContactService';
import { ListContactService } from 'src/service/ListContactService';
import { CreateContactTool } from 'src/tools/CreateContactTool';
import { ListContactTool } from 'src/tools/ListContactTool';
import { Tool, TOOLS } from 'src/tools/Tool';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, ContactController, AgentController],
  providers: [
    AppService,
    PrismaRemoteRepository,
    OpenAIProvider,
    AgentService,
    CreateContactService,
    ListContactService,
    CreateContactTool,
    ListContactTool,
    {
      provide: ContactRepository,
      useClass: PrismaContactRepository,
    },
    {
      provide: TOOLS,
      useFactory: (
        createContactTool: CreateContactTool,
        listContactTool: ListContactTool,
      ): Tool[] => [createContactTool, listContactTool],
      inject: [CreateContactTool, ListContactTool],
    },
  ],
})
export class AppModule {}
