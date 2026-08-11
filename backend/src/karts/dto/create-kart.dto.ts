import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateKartDto {
  @ApiProperty({ description: 'Numéro de course du kart', example: '07' })
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de course est requis' })
  numero: string;

  @ApiProperty({ description: 'Code couleur hexadécimal de la carrosserie', example: '#E53935' })
  @IsString()
  @IsNotEmpty({ message: 'La couleur est requise' })
  @Matches(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: 'La couleur doit être un code hexadécimal valide (ex: #E53935)' })
  couleur: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif du kart', default: true })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;

  @ApiPropertyOptional({ description: "Ordre d'affichage du kart", default: 0 })
  @IsInt()
  @IsOptional()
  ordre?: number;
}
