import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isHexColorMap', async: false })
export class IsHexColorMapConstraint implements ValidatorConstraintInterface {
  validate(couleurs: any, args: ValidationArguments) {
    if (!couleurs || typeof couleurs !== 'object' || Array.isArray(couleurs)) {
      return false;
    }
    const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
    for (const [key, val] of Object.entries(couleurs)) {
      if (typeof key !== 'string' || typeof val !== 'string' || !hexRegex.test(val)) {
        return false;
      }
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Chaque couleur doit être un code hexadécimal valide (ex: #E53935).';
  }
}

export class CreateKartDto {
  @ApiProperty({ description: 'Numéro de plaque du kart', example: '07' })
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de plaque est requis' })
  numeroPlaque: string;

  @ApiProperty({
    description: 'Map des couleurs par pièce (ex: { piece_carrosserie: "#E53935", piece_aileron: "#1A1A1A" })',
    example: { piece_carrosserie: '#E53935', piece_aileron: '#1A1A1A' },
  })
  @IsObject()
  @Validate(IsHexColorMapConstraint)
  couleurs: Record<string, string>;

  @ApiPropertyOptional({
    description: 'URL du modèle .glb de base si personnalisé',
    example: 'https://backend-app-nine-mu.vercel.app/uploads/models/kart_base.glb',
  })
  @IsString()
  @IsOptional()
  modeleBaseUrl?: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif du kart', default: true })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;

  @ApiPropertyOptional({ description: "Ordre d'affichage du kart", default: 0 })
  @IsInt()
  @IsOptional()
  ordre?: number;
}
