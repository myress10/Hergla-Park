import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { EspacesService } from '../espaces/espaces.service';

/**
 * Public multi-tenant routes — no authentication required.
 *
 * These routes are designed for:
 *  - The public showcase website (site vitrine)
 *  - The Unity VR app
 *  - Any external consumer that needs read-only space data
 *
 * The company is identified by its URL-safe `slug` (e.g. "hergla-park").
 * All data is automatically scoped to that company — no leakage possible.
 */
@ApiTags('companies (public)')
@Controller('api/companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly espacesService: EspacesService,
  ) {}

  /**
   * GET /api/companies/:slug
   * Public company info (name, logo, slug).
   */
  @Get(':slug')
  @ApiParam({ name: 'slug', example: 'hergla-park' })
  @ApiOperation({ summary: "Retrieve public info for a company by slug" })
  @ApiResponse({ status: 200, description: 'Company info returned' })
  @ApiResponse({ status: 404, description: 'Company not found or inactive' })
  async getCompany(@Param('slug') slug: string) {
    const company = await this.companiesService.findBySlug(slug);
    return { success: true, data: company };
  }

  /**
   * GET /api/companies/:slug/espaces
   * List all active spaces for a company — public, no auth needed.
   */
  @Get(':slug/espaces')
  @ApiParam({ name: 'slug', example: 'hergla-park' })
  @ApiOperation({ summary: 'List all spaces for a company (public)' })
  @ApiResponse({ status: 200, description: 'Espaces returned' })
  @ApiResponse({ status: 404, description: 'Company not found or inactive' })
  async getEspaces(@Param('slug') slug: string) {
    const companyId = await this.companiesService.resolveCompanyId(slug);
    // Build a synthetic "public" user scoped to this company (no actual user session)
    const publicUser = { id: 'public', role: 'EMPLOYE', companyId, isRoot: false };
    const espaces = await this.espacesService.findAll(publicUser);
    return { success: true, count: espaces.length, data: espaces };
  }

  /**
   * GET /api/companies/:slug/espaces/:id
   * Retrieve a single space by ID, scoped to the company slug.
   */
  @Get(':slug/espaces/:id')
  @ApiParam({ name: 'slug', example: 'hergla-park' })
  @ApiParam({ name: 'id', description: "ID de l'espace" })
  @ApiOperation({ summary: 'Retrieve a single space for a company (public)' })
  @ApiResponse({ status: 200, description: 'Espace returned' })
  @ApiResponse({ status: 404, description: 'Company or space not found' })
  async getEspace(@Param('slug') slug: string, @Param('id') id: string) {
    const companyId = await this.companiesService.resolveCompanyId(slug);
    const publicUser = { id: 'public', role: 'EMPLOYE', companyId, isRoot: false };
    const espace = await this.espacesService.findOne(id, publicUser);
    return { success: true, data: espace };
  }
}

