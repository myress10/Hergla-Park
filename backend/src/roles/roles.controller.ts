import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  @RequirePermissions('role:create', 'role:update', 'role:assign')
  @ApiOperation({ summary: 'List roles available in the company (SaaS Tenant)' })
  @ApiResponse({ status: 200, description: 'Roles list returned' })
  async findAll(@Req() req) {
    return this.rolesService.findAll(req.user.companyId);
  }

  @Post('roles')
  @RequirePermissions('role:create')
  @ApiOperation({ summary: 'Create a custom role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  async create(
    @Body() dto: CreateRoleDto,
    @Req() req,
    @Query('reason') reason?: string, // reason if executed by ROOT
  ) {
    return this.rolesService.create(dto, req.user.companyId, req.user.id, reason);
  }

  @Put('roles/:id')
  @RequirePermissions('role:update')
  @ApiOperation({ summary: 'Update a role or default role (ROOT has full permissions)' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const isRoot = req.isRootUser || false;
    return this.rolesService.update(id, dto, req.user.companyId, req.user.id, isRoot, reason);
  }

  @Delete('roles/:id')
  @RequirePermissions('role:delete')
  @ApiOperation({ summary: 'Delete a custom role' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  async remove(
    @Param('id') id: string,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const isRoot = req.isRootUser || false;
    return this.rolesService.remove(id, req.user.companyId, req.user.id, isRoot, reason);
  }

  @Post('users/:id/roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('role:assign')
  @ApiOperation({ summary: 'Assign roles to a user' })
  @ApiResponse({ status: 200, description: 'User roles updated' })
  async assign(
    @Param('id') userId: string,
    @Body() dto: AssignRolesDto,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const isRoot = req.isRootUser || false;
    return this.rolesService.assignRoles(userId, dto, req.user.companyId, req.user.id, isRoot, reason);
  }
}
