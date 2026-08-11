import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class ReorderKartItemDto {
  @ApiProperty({ description: 'ID du kart', example: 'd3b07384-d113-4603-99b3-1f19b22a00e5' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Nouvel ordre du kart', example: 1 })
  @IsInt()
  ordre: number;
}

export class ReorderKartsDto {
  @ApiProperty({ type: [ReorderKartItemDto], description: 'Liste des karts avec leur nouvel ordre' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderKartItemDto)
  karts: ReorderKartItemDto[];
}
