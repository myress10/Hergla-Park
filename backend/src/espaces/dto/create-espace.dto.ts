import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatutEspace } from '@prisma/client';

export class CreateEspaceDto {
  @ApiProperty({
    description: 'Le nom de l\'espace du parc',
    example: 'Piste Karting Adulte',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom de l\'espace est requis' })
  nom: string;

  @ApiProperty({
    description: 'La catégorie de l\'espace (ex: Karting, Café, Resto, KidZone)',
    example: 'Karting',
  })
  @IsString()
  @IsNotEmpty({ message: 'La catégorie de l\'espace est requise' })
  categorie: string;

  @ApiProperty({
    description: 'Le statut opérationnel actuel de l\'espace',
    enum: StatutEspace,
    default: StatutEspace.FERME,
    required: false,
  })
  @IsEnum(StatutEspace, { message: 'Statut de l\'espace invalide' })
  @IsOptional()
  statut?: StatutEspace;

  @ApiProperty({
    description: 'JSON flexible contenant les données d\'activités de l\'espace',
    example: { longueurPiste: '600m', recordTour: '25.4s', tarifUnique: '15 TND' },
    required: false,
    nullable: true,
  })
  @IsObject({ message: 'Les données spécifiques doivent être un objet JSON valide' })
  @IsOptional()
  donneesSpecifiques?: Record<string, any>;
}
