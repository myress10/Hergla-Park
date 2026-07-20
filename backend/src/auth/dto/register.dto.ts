import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: "Le nom complet de l'utilisateur",
    example: 'Rourou Park',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  nom: string;

  @ApiProperty({
    description: "L'adresse email de l'utilisateur (doit être unique)",
    example: 'rourou@herglapark.com',
  })
  @IsEmail({}, { message: 'Adresse email invalide' })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email: string;

  @ApiProperty({
    description: "Le mot de passe de l'utilisateur (minimum 6 caractères)",
    example: 'SecurePass123',
  })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
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
    description: "L'ID de l'espace du parc assigné (facultatif, pour ADMIN et EMPLOYE)",
    example: 'a60421e4-399a-41df-96fb-d8d5dfd9748b',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  assignedSpaceId?: string;

  @ApiProperty({
    description: "L'ID de l'entreprise (tenant) à laquelle cet utilisateur appartient. Null pour les utilisateurs ROOT globaux.",
    example: 'b70532f5-4aab-52ef-87gc-e9e6ege0859c',
    required: false,
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  companyId?: string;
}
