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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { EspacesService } from './espaces.service';
import { CreateEspaceDto } from './dto/create-espace.dto';
import { UpdateEspaceDto } from './dto/update-espace.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('espaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/espaces')
export class EspacesController {
  constructor(private readonly espacesService: EspacesService) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  @Get()
  @RequirePermissions('espace:read')
  @ApiOperation({ summary: "Retrieve all spaces within scope (tenant or global if ROOT)" })
  @ApiQuery({ name: 'targetCompanyId', required: false, description: 'Filter by company (ROOT only)' })
  @ApiResponse({ status: 200, description: 'Liste des espaces récupérée avec succès' })
  async findAll(
    @Req() req,
    @Query('targetCompanyId') targetCompanyId?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    const spaces = await this.espacesService.findAll(caller, targetCompanyId);
    return { success: true, count: spaces.length, data: spaces };
  }

  @Get(':id')
  @RequirePermissions('espace:read')
  @ApiOperation({ summary: 'Retrieve a single space (scoped)' })
  @ApiResponse({ status: 200, description: "Détail de l'espace" })
  @ApiResponse({ status: 404, description: 'Espace introuvable' })
  async findOne(@Param('id') id: string, @Req() req) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    const space = await this.espacesService.findOne(id, caller);
    return { success: true, data: space };
  }

  @Post()
  @RequirePermissions('espace:create')
  @ApiOperation({ summary: 'Create a new space' })
  @ApiQuery({ name: 'targetCompanyId', required: false, description: 'Target company for the new space (ROOT only)' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  @ApiResponse({ status: 201, description: 'Espace créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(
    @Body() createEspaceDto: CreateEspaceDto,
    @Req() req,
    @Query('targetCompanyId') targetCompanyId?: string,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.espacesService.create(createEspaceDto, caller, targetCompanyId, reason);
  }

  @Put(':id')
  @RequirePermissions('espace:update')
  @ApiOperation({ summary: 'Update space details or operational status' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  @ApiResponse({ status: 200, description: 'Espace mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Espace introuvable' })
  async update(
    @Param('id') id: string,
    @Body() updateEspaceDto: UpdateEspaceDto,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.espacesService.update(id, updateEspaceDto, caller, reason);
  }

  @Delete(':id')
  @RequirePermissions('espace:delete')
  @ApiOperation({ summary: 'Delete a space' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  @ApiResponse({ status: 200, description: 'Espace supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Espace introuvable' })
  async remove(
    @Param('id') id: string,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.espacesService.remove(id, caller, reason);
  }

  // ─── Scene management ────────────────────────────────────────────────────────

  @Get(':id/scene')
  @ApiTags('scene')
  @RequirePermissions('espace:read')
  @ApiOperation({ summary: 'Retrieve 3D scene config for a space' })
  async getScene(@Param('id') id: string, @Req() req) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.espacesService.getScene(id, caller);
  }

  @Put(':id/scene')
  @ApiTags('scene')
  @RequirePermissions('scene:edit')
  @ApiOperation({ summary: 'Update 3D scene placements for a space' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  async updateScene(
    @Param('id') id: string,
    @Body() body: { placements: any[] },
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.espacesService.updateScene(id, body.placements, caller, reason);
  }

  @Post(':id/scene/reset')
  @ApiTags('scene')
  @RequirePermissions('scene:reset')
  @ApiOperation({ summary: 'Reset 3D scene to the original version' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  async resetScene(
    @Param('id') id: string,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.espacesService.resetScene(id, caller, reason);
  }

  @Post(':id/scene/set-as-original')
  @ApiTags('scene')
  @RequirePermissions('espace:update') // system roles having espace:update (SUPERADMIN/ADMIN) can lock scene
  @ApiOperation({ summary: 'Save current placements as the official original version' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  async setAsOriginal(
    @Param('id') id: string,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.espacesService.setAsOriginal(id, caller, reason);
  }
}
