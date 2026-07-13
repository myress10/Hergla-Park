import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Le nom complet de l\'utilisateur à mettre à jour',
    example: 'Jean Dupont Modifié',
    required: false,
  })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiProperty({
    description: 'L\'adresse email de l\'utilisateur à mettre à jour',
    example: 'jean.updated@herglapark.com',
    required: false,
  })
  @IsEmail({}, { message: 'Adresse email invalide' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Le nouveau mot de passe (sera haché automatiquement avant stockage)',
    example: 'NewSecurePass123',
    required: false,
  })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Le rôle de l\'utilisateur (uniquement modifiable par SUPERADMIN)',
    enum: Role,
    required: false,
  })
  @IsEnum(Role, { message: 'Rôle invalide' })
  @IsOptional()
  role?: Role;

  @ApiProperty({
    description: 'L\'ID de l\'espace du parc assigné (uniquement modifiable par SUPERADMIN)',
    example: 'a60421e4-399a-41df-96fb-d8d5dfd9748b',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  assignedSpaceId?: string;
}
