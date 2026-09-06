import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateLapTimeDto {
  @ApiProperty({
    description: 'Pseudo du joueur/visiteur (2 à 20 caractères)',
    example: 'SpeedyPilot',
    minLength: 2,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le pseudo est requis' })
  @Length(2, 20, { message: 'Le pseudo doit comporter entre 2 et 20 caractères' })
  pseudo: string;

  @ApiProperty({
    description: 'Temps au tour en millisecondes (entre 5 000 et 600 000 ms)',
    example: 48250,
  })
  @IsInt({ message: 'Le temps doit être un nombre entier en millisecondes' })
  @Min(5000, { message: 'Le temps au tour minimal valide est de 5 000 ms (5 secondes)' })
  @Max(600000, { message: 'Le temps au tour maximal valide est de 600 000 ms (10 minutes)' })
  tempsMs: number;

  @ApiPropertyOptional({
    description: 'Identifiant optionnel du kart utilisé pour le tour',
    example: '1f8dca49-38c2-405a-be0a-c6dbf50d87f2',
  })
  @IsString()
  @IsOptional()
  kartId?: string;
}
