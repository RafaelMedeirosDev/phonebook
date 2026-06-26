import { IsNotEmpty, IsString } from 'class-validator';

export class AskAgentDTO {
  @IsNotEmpty()
  @IsString()
  message!: string;
}
