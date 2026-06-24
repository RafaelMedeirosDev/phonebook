import { Injectable } from '@nestjs/common';
import { Contact } from '@prisma/client';
import { ContactRepository } from 'src/domain/ContactRepository';
import { ContactAlreadyExists } from 'src/shared/erros/cases/ContactAlreadyExists';

interface Request {
  name: string;
  phone: string;
}

@Injectable()
export class CreateContactService {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute({ name, phone }: Request): Promise<Contact> {
    const phoneAlreadyExists = await this.contactRepository.findByPhone({
      phone,
    });

    if (phoneAlreadyExists) {
      throw new ContactAlreadyExists();
    }

    return await this.contactRepository.create({ name, phone });
  }
}
