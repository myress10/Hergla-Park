import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import {
  CreateUpgradeRequestDto,
  ProcessUpgradeRequestDto,
  DirectPackOverrideDto,
} from './dto/upgrade-request.dto';
import { UpgradeRequestStatus } from './subscriptions.constants';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my-plan')
  @ApiOperation({ summary: 'Get current company subscription details, quotas, and usage' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Optional companyId override for ROOT or multi-tenant' })
  @ApiResponse({ status: 200, description: 'Subscription and quota details' })
  async getMyPlan(@Req() req, @Query('companyId') companyIdQuery?: string) {
    const targetCompanyId = companyIdQuery || req.user.companyId;

    if (!targetCompanyId) {
      throw new BadRequestException('Aucune entreprise spécifiée ou rattachée à cet utilisateur.');
    }

    return this.subscriptionsService.getCompanyPlan(targetCompanyId);
  }

  @Post('upgrade-request')
  @RequirePermissions('upgrade:request')
  @ApiOperation({ summary: 'Submit a new upgrade request (SUPERADMIN / ROOT)' })
  @ApiResponse({ status: 201, description: 'Upgrade request submitted successfully' })
  async requestUpgrade(
    @Req() req,
    @Body() dto: CreateUpgradeRequestDto,
    @Query('companyId') companyIdQuery?: string,
  ) {
    const targetCompanyId = companyIdQuery || req.user.companyId;

    if (!targetCompanyId) {
      throw new BadRequestException('Aucune entreprise spécifiée pour la demande.');
    }

    return this.subscriptionsService.createUpgradeRequest(
      targetCompanyId,
      req.user.id,
      dto.targetPack,
      dto.notes,
      dto.contactPhone,
    );
  }

  // ─── ROOT ENDPOINTS ────────────────────────────────────────────────────────

  @Get('root/companies')
  @RequirePermissions('upgrade:manage')
  @ApiOperation({ summary: 'List all companies with subscription pack status and superadmins (ROOT only)' })
  @ApiResponse({ status: 200, description: 'List of companies with packs' })
  async listAllCompanies() {
    return this.subscriptionsService.getAllCompaniesWithPacks();
  }

  @Get('root/requests')
  @RequirePermissions('upgrade:manage')
  @ApiOperation({ summary: 'List all upgrade requests across companies (ROOT only)' })
  @ApiQuery({ name: 'status', required: false, enum: UpgradeRequestStatus })
  @ApiResponse({ status: 200, description: 'List of upgrade requests' })
  async listAllRequests(@Query('status') status?: UpgradeRequestStatus) {
    return this.subscriptionsService.getAllUpgradeRequests(status);
  }

  @Post('root/requests/:id/approve')
  @RequirePermissions('upgrade:manage')
  @ApiOperation({ summary: 'Approve an upgrade request and apply the new pack to the company (ROOT only)' })
  @ApiResponse({ status: 200, description: 'Upgrade request approved and company updated' })
  async approveRequest(
    @Param('id') id: string,
    @Req() req,
    @Body() dto: ProcessUpgradeRequestDto,
  ) {
    return this.subscriptionsService.approveUpgradeRequest(id, req.user.id, dto?.adminResponse);
  }

  @Post('root/requests/:id/reject')
  @RequirePermissions('upgrade:manage')
  @ApiOperation({ summary: 'Reject an upgrade request with a reason (ROOT only)' })
  @ApiResponse({ status: 200, description: 'Upgrade request rejected' })
  async rejectRequest(
    @Param('id') id: string,
    @Req() req,
    @Body() dto: ProcessUpgradeRequestDto,
  ) {
    return this.subscriptionsService.rejectUpgradeRequest(id, req.user.id, dto?.adminResponse);
  }

  @Patch('root/company/:companyId/pack')
  @RequirePermissions('upgrade:manage')
  @ApiOperation({ summary: 'Directly modify the subscription pack of any company (ROOT only)' })
  @ApiResponse({ status: 200, description: 'Company pack updated' })
  async overrideCompanyPack(
    @Param('companyId') companyId: string,
    @Req() req,
    @Body() dto: DirectPackOverrideDto,
  ) {
    return this.subscriptionsService.setCompanyPackManually(
      companyId,
      dto.pack,
      req.user.id,
      dto.reason,
    );
  }
}
