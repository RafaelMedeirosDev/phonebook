import { IsNotEmpty, IsString } from 'class-validator';

export class CreateContactDTO {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;
}
