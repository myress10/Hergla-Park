import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatutEspace } from '@prisma/client';

export class UpdateEspaceDto {
  @ApiProperty({
    description: 'Le nom de l\'espace (uniquement modifiable par SUPERADMIN)',
    example: 'Cafétéria Centrale',
    required: false,
  })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiProperty({
    description: 'La catégorie de l\'espace (uniquement modifiable par SUPERADMIN)',
    example: 'Café',
    required: false,
  })
  @IsString()
  @IsOptional()
  categorie?: string;

  @ApiProperty({
    description: 'Le statut opérationnel actuel de l\'espace',
    enum: StatutEspace,
    required: false,
  })
  @IsEnum(StatutEspace, { message: 'Statut de l\'espace invalide' })
  @IsOptional()
  statut?: StatutEspace;

  @ApiProperty({
    description: 'JSON flexible contenant les données d\'activités de l\'espace',
    example: { menuDuJour: ['Sandwich', 'Crêpe', 'Soda'], ouvertLeMatin: true },
    required: false,
    nullable: true,
  })
  @IsObject({ message: 'Les données spécifiques doivent être un objet JSON valide' })
  @IsOptional()
  donneesSpecifiques?: Record<string, any>;
}
