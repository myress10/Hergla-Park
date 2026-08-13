import { IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    description: "Le nom du rôle (uniquement modifiable par SUPERADMIN ou ROOT). Ex: 'ADMIN', 'Responsable Café'.",
    example: 'ADMIN',
    required: false,
  })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({
    description: 'L\'ID de l\'espace du parc assigné (uniquement modifiable par SUPERADMIN)',
    example: 'a60421e4-399a-41df-96fb-d8d5dfd9748b',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  assignedSpaceId?: string;

  @ApiProperty({
    description: 'Numéro de téléphone de l\'utilisateur',
    example: '+216 98 123 456',
    required: false,
  })
  @IsString()
  @IsOptional()
  telephone?: string;

  @ApiProperty({
    description: 'Langue préférée (fr, ar, en)',
    example: 'fr',
    required: false,
  })
  @IsString()
  @IsOptional()
  langue?: string;

  @ApiProperty({
    description: 'Statut de l\'utilisateur',
    example: 'Connecté',
    required: false,
  })
  @IsString()
  @IsOptional()
  statut?: string;

  @ApiProperty({
    description: 'Liste des permissions personnalisées accordées',
    example: ['espace:update', 'kart:manage'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  customPermissions?: string[];
}

