import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'The registered email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'securepassword123',
    description: 'The password of the user account',
  })
  password: string;
}
