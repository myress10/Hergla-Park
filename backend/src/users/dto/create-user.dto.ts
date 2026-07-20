import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Le nom complet de l\'utilisateur',
    example: 'Jean Dupont',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  nom: string;

  @ApiProperty({
    description: 'L\'adresse email de l\'utilisateur',
    example: 'jean.dupont@herglapark.tn',
  })
  @IsEmail({}, { message: 'Adresse email invalide' })
  @IsNotEmpty({ message: 'L\'adresse email est requise' })
  email: string;

  @ApiProperty({
    description: 'Le mot de passe de l\'utilisateur',
    example: 'SecurePass123',
  })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;

  @ApiProperty({
    description: "Le nom du rôle à assigner (ex: 'SUPERADMIN', 'ADMIN', 'EMPLOYE', ou un rôle personnalisé). Par défaut: 'EMPLOYE'.",
    example: 'EMPLOYE',
    required: false,
  })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({
    description: 'L\'ID de l\'espace du parc assigné',
    example: 'a60421e4-399a-41df-96fb-d8d5dfd9748b',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  assignedSpaceId?: string;
}
