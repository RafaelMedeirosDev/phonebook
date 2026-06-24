import { Injectable } from '@nestjs/common';
import { Contact } from '@prisma/client';
import { ContactRepository } from 'src/domain/ContactRepository';

@Injectable()
export class ListContactService {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(): Promise<Contact[]> {
    return await this.contactRepository.findAll();
  }
}
