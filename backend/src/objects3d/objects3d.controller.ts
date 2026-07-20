import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Objects3dService } from './objects3d.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateObject3dDto } from './dto/create-object3d.dto';

@ApiTags('objects3d')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/objects3d')
export class Objects3dController {
  constructor(private readonly objects3dService: Objects3dService) {}

  @Get()
  @RequirePermissions('espace:read') // standard view
  @ApiOperation({ summary: 'Get 3D objects catalog' })
  @ApiQuery({ name: 'targetCompanyId', required: false, description: 'Filter by company (ROOT only)' })
  @ApiResponse({ status: 200, description: 'Catalog retrieved successfully' })
  async findAll(
    @Req() req,
    @Query('targetCompanyId') targetCompanyId?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.objects3dService.findAll(caller, targetCompanyId);
  }

  @Post()
  @RequirePermissions('scene:edit') // standard scene editing rights needed to modify catalogues
  @ApiOperation({ summary: 'Add standard 3D object to catalog' })
  @ApiQuery({ name: 'targetCompanyId', required: false, description: 'Target company (ROOT only)' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  @ApiResponse({ status: 201, description: 'Object created successfully' })
  async createBase(
    @Body() dto: CreateObject3dDto,
    @Req() req,
    @Query('targetCompanyId') targetCompanyId?: string,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.objects3dService.createBase(dto, caller, targetCompanyId, reason);
  }

  @Post('upload')
  @RequirePermissions('scene:edit')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'model', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a custom 3D model (.glb) + optional thumbnail' })
  @ApiQuery({ name: 'targetCompanyId', required: false, description: 'Target company (ROOT only)' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nom: { type: 'string' },
        categorie: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier de modèle 3D (.glb) - alternative field name',
        },
        model: {
          type: 'string',
          format: 'binary',
          description: 'Fichier de modèle 3D (.glb)',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Vignette (image, optionnel)',
        },
      },
      required: ['nom', 'categorie'],
    },
  })
  async upload(
    @UploadedFiles()
    files: { file?: any[]; model?: any[]; thumbnail?: any[] },
    @Body('nom') nom: string,
    @Body('categorie') categorie: string,
    @Req() req,
    @Query('targetCompanyId') targetCompanyId?: string,
    @Query('reason') reason?: string,
  ) {
    const glbFile = files.model?.[0] || files.file?.[0];
    const thumbFile = files.thumbnail?.[0];
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.objects3dService.uploadCustom(
      nom,
      categorie,
      glbFile,
      thumbFile,
      caller,
      targetCompanyId,
      reason,
    );
  }

  @Delete(':id')
  @RequirePermissions('scene:edit')
  @ApiOperation({ summary: 'Delete a 3D object from catalog' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  async remove(
    @Param('id') id: string,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.objects3dService.remove(id, caller, reason);
  }
}
