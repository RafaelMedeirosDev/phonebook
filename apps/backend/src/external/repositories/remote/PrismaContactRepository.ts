import { Injectable } from '@nestjs/common';
import { Contact } from '@prisma/client';
import {
  Create,
  ContactRepository,
  FindByPhone,
} from 'src/domain/ContactRepository';
import { PrismaRemoteRepository } from './PrismaRemoteRepository';

@Injectable()
export class PrismaContactRepository implements ContactRepository {
  constructor(private readonly repository: PrismaRemoteRepository) {}

  create({ name, phone }: Create): Promise<Contact> {
    return this.repository.contact.create({ data: { name, phone } });
  }

  findAll(): Promise<Contact[]> {
    return this.repository.contact.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findByPhone({ phone }: FindByPhone): Promise<Contact | null> {
    return this.repository.contact.findUnique({ where: { phone } });
  }
}
