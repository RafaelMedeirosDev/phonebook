import { AlreadyExistsError } from '../base/AlreadyExistsError';

const message = 'Contact Already exists.' as const;
const error = `contact_already_exists` as const;

export class ContactAlreadyExists extends AlreadyExistsError {
  constructor() {
    super(message, error);
  }
}
