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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateObject3dDto } from './dto/create-object3d.dto';

@ApiTags('objects3d')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/objects3d')
export class Objects3dController {
  constructor(private readonly objects3dService: Objects3dService) {}

  @Get()
  @ApiOperation({ summary: 'Get 3D objects catalog (filtered by category)' })
  @ApiResponse({ status: 200, description: 'Catalog retrieved successfully' })
  async findAll(@Query('categorie') categorie?: string) {
    return this.objects3dService.findAll(categorie);
  }

  @Post()
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Add standard 3D object to catalog (SUPERADMIN only)' })
  @ApiResponse({ status: 201, description: 'Object created successfully' })
  async createBase(@Body() dto: CreateObject3dDto) {
    return this.objects3dService.createBase(dto);
  }

  @Post('upload')
  @Roles(Role.SUPERADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'model', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a custom 3D model (.glb) + optional thumbnail' })
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
    files: {
      file?: any[];
      model?: any[];
      thumbnail?: any[];
    },
    @Body('nom') nom: string,
    @Body('categorie') categorie: string,
    @Req() req,
  ) {
    const glbFile = files.model?.[0] || files.file?.[0];
    const thumbFile = files.thumbnail?.[0];
    return this.objects3dService.uploadCustom(nom, categorie, glbFile, thumbFile, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a 3D object from catalog (SUPERADMIN or owner)' })
  async remove(@Param('id') id: string, @Req() req) {
    return this.objects3dService.remove(id, req.user);
  }
}
