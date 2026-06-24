import { Injectable } from '@nestjs/common';
import { Contact } from '@prisma/client';
import { CreateContactService } from 'src/service/CreateContactService';
import { Tool } from 'src/tools/Tool';

interface Input {
  name: string;
  phone: string;
}

@Injectable()
export class CreateContactTool implements Tool<Input, Contact> {
  readonly name = 'create_contact';
  readonly description = 'Cria um novo contato na agenda com nome e telefone.';
  readonly parameters = {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Nome do contato' },
      phone: { type: 'string', description: 'Telefone do contato' },
    },
    required: ['name', 'phone'],
  };

  constructor(private readonly createContactService: CreateContactService) {}

  execute({ name, phone }: Input): Promise<Contact> {
    return this.createContactService.execute({ name, phone });
  }
}
