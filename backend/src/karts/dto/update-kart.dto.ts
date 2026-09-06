import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Validate } from 'class-validator';
import { IsHexColorMapConstraint } from './create-kart.dto';

export class UpdateKartDto {
  @ApiPropertyOptional({ description: 'Numéro de plaque du kart', example: '07' })
  @IsString()
  @IsOptional()
  numeroPlaque?: string;

  @ApiPropertyOptional({
    description: 'Map des couleurs par pièce (ex: { piece_carrosserie: "#E53935", piece_aileron: "#1A1A1A" })',
    example: { piece_carrosserie: '#E53935', piece_aileron: '#1A1A1A' },
  })
  @IsObject()
  @Validate(IsHexColorMapConstraint)
  @IsOptional()
  couleurs?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'URL du modèle .glb de base si personnalisé',
    example: 'https://backend-app-nine-mu.vercel.app/uploads/models/kart_base.glb',
  })
  @IsString()
  @IsOptional()
  modeleBaseUrl?: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif du kart' })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;

  @ApiPropertyOptional({ description: "Ordre d'affichage du kart" })
  @IsInt()
  @IsOptional()
  ordre?: number;
}
