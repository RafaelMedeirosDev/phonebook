import { Body, Controller, Get, Post } from '@nestjs/common';
import { Contact } from '@prisma/client';
import { CreateContactService } from 'src/service/CreateContactService';
import { ListContactService } from 'src/service/ListContactService';
import { CreateContactDTO } from 'src/shared/dtos/CreateContactDTO';

@Controller('/contacts')
export class ContactController {
  constructor(
    private readonly createContactService: CreateContactService,
    private readonly listContactService: ListContactService,
  ) {}

  @Post()
  create(@Body() { name, phone }: CreateContactDTO): Promise<Contact> {
    return this.createContactService.execute({ name, phone });
  }

  @Get()
  list(): Promise<Contact[]> {
    return this.listContactService.execute();
  }
}
