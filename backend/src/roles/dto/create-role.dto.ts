import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Responsable Café' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: ['espace:update', 'scene:edit'] })
  @IsArray()
  @IsString({ each: true })
  permissionKeys: string[];
}
