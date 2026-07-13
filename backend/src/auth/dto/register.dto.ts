import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'Le nom complet de l\'utilisateur',
    example: 'Rourou Park',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  nom: string;

  @ApiProperty({
    description: 'L\'adresse email de l\'utilisateur (doit être unique)',
    example: 'rourou@herglapark.com',
  })
  @IsEmail({}, { message: 'Adresse email invalide' })
  @IsNotEmpty({ message: 'L\'email est obligatoire' })
  email: string;

  @ApiProperty({
    description: 'Le mot de passe de l\'utilisateur (minimum 6 caractères)',
    example: 'SecurePass123',
  })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @ApiProperty({
    description: 'Le rôle de l\'utilisateur au sein du parc',
    enum: Role,
    default: Role.EMPLOYE,
    required: false,
  })
  @IsEnum(Role, { message: 'Rôle invalide' })
  @IsOptional()
  role?: Role;

  @ApiProperty({
    description: 'L\'ID de l\'espace du parc assigné (facultatif, pour ADMIN et EMPLOYE)',
    example: 'a60421e4-399a-41df-96fb-d8d5dfd9748b',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  assignedSpaceId?: string;
}
