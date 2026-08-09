import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SwitchCompanyDto {
  @ApiProperty({ description: "L'identifiant (ID) de l'entreprise vers laquelle effectuer la bascule", example: 'company-uuid-123' })
  @IsNotEmpty({ message: "L'identifiant de l'entreprise est obligatoire" })
  @IsString({ message: "L'identifiant de l'entreprise doit être une chaîne de caractères" })
  companyId: string;
}
