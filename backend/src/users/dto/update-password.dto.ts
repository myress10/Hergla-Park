import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Le nouveau mot de passe de l\'utilisateur (sera haché avant stockage)',
    example: 'NouveauMotDePasseSecurise123',
    required: true,
  })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;
}
