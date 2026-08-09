import { Controller, Get, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { RootService } from './root.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('root')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('logs:view') // Restrict all root endpoints to users having logs:view (ROOT only)
@Controller('api/root')
export class RootController {
  constructor(private readonly rootService: RootService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Retrieve all roles in the entire database (ROOT only)' })
  @ApiResponse({ status: 200, description: 'Global roles returned' })
  async getRoles() {
    return this.rootService.findAllRoles();
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete any company custom role (ROOT only)' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  async deleteRole(
    @Param('id') id: string,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    return this.rootService.removeRole(id, req.user.id, reason);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Retrieve system-wide activity audit logs (ROOT only)' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'isRootIntervention', required: false, type: Boolean })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit logs returned' })
  async getLogs(
    @Query('companyId') companyId?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('isRootIntervention') isRootIntervention?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.rootService.findLogs({
      companyId,
      actorId,
      action,
      isRootIntervention,
      startDate,
      endDate,
      page,
      limit,
    });
  }
}
