import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EspacesService } from './espaces.service';
import { CreateEspaceDto } from './dto/create-espace.dto';
import { UpdateEspaceDto } from './dto/update-espace.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('espaces')
@Controller('api/espaces')
export class EspacesController {
  constructor(private readonly espacesService: EspacesService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve list of all park spaces (Public)' })
  @ApiResponse({ status: 200, description: 'Liste des espaces récupérée avec succès' })
  async findAll() {
    const spaces = await this.espacesService.findAll();
    return {
      success: true,
      count: spaces.length,
      data: spaces,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve details of a single park space (Public)' })
  @ApiResponse({ status: 200, description: 'Détail de l\'espace' })
  @ApiResponse({ status: 404, description: 'Espace introuvable' })
  async findOne(@Param('id') id: string) {
    const space = await this.espacesService.findOne(id);
    return {
      success: true,
      data: space,
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new park space (SUPERADMIN only)' })
  @ApiResponse({ status: 201, description: 'Espace créé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(@Body() createEspaceDto: CreateEspaceDto) {
    return this.espacesService.create(createEspaceDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update space details or operational status' })
  @ApiResponse({ status: 200, description: 'Espace mis à jour avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé ou non assigné' })
  @ApiResponse({ status: 404, description: 'Espace introuvable' })
  async update(@Param('id') id: string, @Body() updateEspaceDto: UpdateEspaceDto, @Req() req) {
    return this.espacesService.update(id, updateEspaceDto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a park space config (SUPERADMIN only)' })
  @ApiResponse({ status: 200, description: 'Espace supprimé avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Espace introuvable' })
  async remove(@Param('id') id: string) {
    return this.espacesService.remove(id);
  }

  @Get(':id/scene')
  @ApiTags('scene')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Retrieve 3D scene config for a space' })
  async getScene(@Param('id') id: string, @Req() req) {
    return this.espacesService.getScene(id, req.user);
  }

  @Put(':id/scene')
  @ApiTags('scene')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update 3D scene placements for a space' })
  async updateScene(@Param('id') id: string, @Body() body: { placements: any[] }, @Req() req) {
    return this.espacesService.updateScene(id, body.placements, req.user);
  }

  @Post(':id/scene/reset')
  @ApiTags('scene')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Reset 3D scene config to the original version' })
  async resetScene(@Param('id') id: string, @Req() req) {
    return this.espacesService.resetScene(id, req.user);
  }

  @Post(':id/scene/set-as-original')
  @ApiTags('scene')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Save current placements as the official original version (SUPERADMIN only)' })
  async setAsOriginal(@Param('id') id: string, @Req() req) {
    return this.espacesService.setAsOriginal(id, req.user);
  }
}
