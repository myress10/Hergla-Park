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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KartsService } from './karts.service';
import { CreateKartDto } from './dto/create-kart.dto';
import { UpdateKartDto } from './dto/update-kart.dto';
import { ReorderKartsDto } from './dto/reorder-karts.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('karts')
@Controller('api/espaces/:id/karts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class KartsController {
  constructor(private readonly kartsService: KartsService) {}

  @Get()
  @RequirePermissions('kart:read')
  @ApiOperation({ summary: "Liste des karts d'un espace (authentifié, scopé par entreprise et espace assigné)" })
  @ApiParam({ name: 'id', description: "ID de l'espace" })
  @ApiResponse({ status: 200, description: 'Liste des karts récupérée avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Espace introuvable' })
  async findAll(@Param('id') id: string, @Req() req) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    const karts = await this.kartsService.findAll(id, caller);
    return { success: true, count: karts.length, data: karts };
  }

  @Post()
  @RequirePermissions('kart:manage')
  @ApiOperation({ summary: "Création d'un kart pour un espace" })
  @ApiParam({ name: 'id', description: "ID de l'espace" })
  @ApiResponse({ status: 201, description: 'Kart créé avec succès' })
  @ApiResponse({ status: 400, description: 'Numéro de kart déjà existant dans cet espace' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(@Param('id') id: string, @Body() createKartDto: CreateKartDto, @Req() req) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.kartsService.create(id, createKartDto, caller);
  }

  @Put('reorder')
  @RequirePermissions('kart:manage')
  @ApiOperation({ summary: "Mise à jour de l'ordre de plusieurs karts en une seule requête" })
  @ApiParam({ name: 'id', description: "ID de l'espace" })
  @ApiResponse({ status: 200, description: 'Ordre des karts mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données de réordonnancement invalides' })
  async reorder(@Param('id') id: string, @Body() reorderDto: ReorderKartsDto, @Req() req) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.kartsService.reorder(id, reorderDto.karts, caller);
  }

  @Put(':kartId')
  @RequirePermissions('kart:manage')
  @ApiOperation({ summary: "Modification d'un kart (numéro, couleur, statut actif, ordre)" })
  @ApiParam({ name: 'id', description: "ID de l'espace" })
  @ApiParam({ name: 'kartId', description: 'ID du kart à modifier' })
  @ApiResponse({ status: 200, description: 'Kart mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Kart introuvable' })
  async update(
    @Param('id') id: string,
    @Param('kartId') kartId: string,
    @Body() updateKartDto: UpdateKartDto,
    @Req() req,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.kartsService.update(id, kartId, updateKartDto, caller);
  }

  @Delete(':kartId')
  @RequirePermissions('kart:manage')
  @ApiOperation({ summary: "Suppression d'un kart" })
  @ApiParam({ name: 'id', description: "ID de l'espace" })
  @ApiParam({ name: 'kartId', description: 'ID du kart à supprimer' })
  @ApiResponse({ status: 200, description: 'Kart supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Kart introuvable' })
  async remove(@Param('id') id: string, @Param('kartId') kartId: string, @Req() req) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.kartsService.remove(id, kartId, caller);
  }
}

@ApiTags('karts')
@Controller('api/companies/:slug/espaces/:espaceId/karts')
export class PublicKartsController {
  constructor(private readonly kartsService: KartsService) {}

  @Get()
  @ApiOperation({
    summary: 'Configuration des karts pour Unity (Public)',
    description: 'Consommé par l’application Unity — aucune authentification requise. Retourne uniquement les karts actifs triés par ordre.',
  })
  @ApiParam({ name: 'slug', example: 'hergla-park', description: 'Slug de l’entreprise' })
  @ApiParam({ name: 'espaceId', description: "ID de l'espace Karting" })
  @ApiResponse({
    status: 200,
    description: 'Liste minimale des karts actifs [{ numero, couleur }]',
  })
  async getPublicKarts(@Param('slug') slug: string, @Param('espaceId') espaceId: string) {
    return this.kartsService.findPublicKarts(slug, espaceId);
  }
}
