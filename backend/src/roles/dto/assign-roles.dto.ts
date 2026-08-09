import { IsArray, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRolesDto {
  @ApiProperty({ example: ['system-role-admin'] })
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];

  @ApiProperty({ example: 'replace', enum: ['replace', 'add'] })
  @IsEnum(['replace', 'add'])
  mode: 'replace' | 'add';
}
