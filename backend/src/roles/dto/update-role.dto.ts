import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ example: 'Responsable Café (Nouveau Nom)', required: false })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiProperty({ example: ['espace:update', 'scene:edit'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionKeys?: string[];
}
