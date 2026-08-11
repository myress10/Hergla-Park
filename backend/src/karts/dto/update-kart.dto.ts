import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateKartDto {
  @ApiPropertyOptional({ description: 'Numéro de course du kart', example: '07' })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiPropertyOptional({ description: 'Code couleur hexadécimal de la carrosserie', example: '#E53935' })
  @IsString()
  @IsOptional()
  @Matches(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: 'La couleur doit être un code hexadécimal valide (ex: #E53935)' })
  couleur?: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif du kart' })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;

  @ApiPropertyOptional({ description: "Ordre d'affichage du kart" })
  @IsInt()
  @IsOptional()
  ordre?: number;
}
