import { ConflictException, HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class AlreadyExistsError extends ConflictException {
  @ApiProperty({ example: HttpStatus.CONFLICT })
  declare public statusCode: number;

  @ApiProperty({ type: () => String })
  declare public message: string;

  @ApiProperty({ type: () => String })
  declare public error: string;

  constructor(message: string, error: string) {
    super(message, error);
  }
}
