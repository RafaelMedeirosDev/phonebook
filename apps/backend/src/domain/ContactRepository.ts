import { Contact } from '@prisma/client';

export interface Create {
  name: string;
  phone: string;
}

export interface FindByPhone {
  phone: string;
}

export abstract class ContactRepository {
  abstract create({ name, phone }: Create): Promise<Contact>;
  abstract findAll(): Promise<Contact[]>;
  abstract findByPhone({ phone }: FindByPhone): Promise<Contact | null>;
}
