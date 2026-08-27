import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPack, UpgradeRequestStatus } from '../subscriptions.constants';

export class CreateUpgradeRequestDto {
  @ApiProperty({ enum: SubscriptionPack, description: 'Target pack to upgrade to' })
  @IsEnum(SubscriptionPack)
  @IsNotEmpty()
  targetPack: SubscriptionPack;

  @ApiPropertyOptional({ description: 'Specific project requirements or message' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  contactPhone?: string;
}

export class ProcessUpgradeRequestDto {
  @ApiPropertyOptional({ description: 'Admin response / notes for the client' })
  @IsString()
  @IsOptional()
  adminResponse?: string;
}

export class DirectPackOverrideDto {
  @ApiProperty({ enum: SubscriptionPack, description: 'New subscription pack to assign' })
  @IsEnum(SubscriptionPack)
  @IsNotEmpty()
  pack: SubscriptionPack;

  @ApiPropertyOptional({ description: 'Reason for override' })
  @IsString()
  @IsOptional()
  reason?: string;
}
