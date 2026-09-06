import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LapTimesService } from './laptimes.service';
import { CreateLapTimeDto } from './dto/create-laptime.dto';

@ApiTags('laptimes')
@Controller('api/companies/:slug/espaces/:espaceId/laptimes')
export class LapTimesController {
  constructor(private readonly lapTimesService: LapTimesService) {}

  @Post()
  @ApiOperation({
    summary: 'Enregistrement d’un temps au tour (Public — aucun compte requis)',
    description: 'Enregistre le score et le chrono réalisé par un visiteur sur le prototype Three.js ou Unity.',
  })
  @ApiParam({ name: 'slug', example: 'hergla-park', description: 'Slug de l’entreprise' })
  @ApiParam({ name: 'espaceId', description: 'ID de l’espace Karting' })
  @ApiResponse({ status: 201, description: 'Temps au tour enregistré' })
  @ApiResponse({ status: 400, description: 'Données invalides ou pseudo incorrect' })
  @ApiResponse({ status: 404, description: 'Espace ou entreprise introuvable' })
  async record(
    @Param('slug') slug: string,
    @Param('espaceId') espaceId: string,
    @Body() dto: CreateLapTimeDto,
  ) {
    return this.lapTimesService.recordLapTime(slug, espaceId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Classement (Leaderboard) des meilleurs temps au tour (Public)',
    description: 'Retourne les N meilleurs temps au tour triés par ordre croissant (tempsMs asc).',
  })
  @ApiParam({ name: 'slug', example: 'hergla-park', description: 'Slug de l’entreprise' })
  @ApiParam({ name: 'espaceId', description: 'ID de l’espace Karting' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Nombre maximum de résultats (1 à 50, défaut 10)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des meilleurs temps [{ pseudo, tempsMs, numeroKart }]',
  })
  async getLeaderboard(
    @Param('slug') slug: string,
    @Param('espaceId') espaceId: string,
    @Query('limit') limit?: number,
  ) {
    return this.lapTimesService.getLeaderboard(slug, espaceId, limit);
  }
}
