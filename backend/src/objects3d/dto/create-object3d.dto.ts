import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateObject3dDto {
  @ApiProperty({
    description: 'Le nom de l\'objet 3D',
    example: 'Table de Réunion',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'La catégorie de l\'objet (ex: mobilier, decoration, signaletique)',
    example: 'mobilier',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  categorie: string;

  @ApiProperty({
    description: 'L\'URL/chemin vers le fichier de modèle (.glb)',
    example: '/uploads/models/table_reunion.glb',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  modelUrl: string;

  @ApiProperty({
    description: 'L\'URL/chemin vers l\'image de prévisualisation (vignette)',
    example: '/uploads/thumbnails/table_reunion.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;
}
