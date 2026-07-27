import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user',
  })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email address of the user (must be unique)',
  })
  email: string;

  @ApiProperty({
    example: 'securepassword123',
    description: 'The password for the user account',
  })
  password: string;
}
