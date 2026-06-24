import { Injectable } from '@nestjs/common';
import { Contact } from '@prisma/client';
import { ListContactService } from 'src/service/ListContactService';
import { Tool } from 'src/tools/Tool';

@Injectable()
export class ListContactTool implements Tool<void, Contact[]> {
  readonly name = 'list_contacts';
  readonly description = 'Retorna a lista completa de contatos da agenda.';
  readonly parameters = {
    type: 'object' as const,
    properties: {},
  };

  constructor(private readonly listContactService: ListContactService) {}

  execute(): Promise<Contact[]> {
    return this.listContactService.execute();
  }
}
