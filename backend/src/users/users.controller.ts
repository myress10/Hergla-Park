import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Retrieve list of all registered users (SUPERADMIN only)' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      count: users.length,
      data: users,
    };
  }

  @Post()
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new user account (SUPERADMIN only)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé' })
  @ApiResponse({ status: 400, description: 'Données invalides ou email existant' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve single user profile metadata' })
  @ApiResponse({ status: 200, description: 'Détail de l\'utilisateur' })
  @ApiResponse({ status: 403, description: 'Non autorisé à voir un profil tiers' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async findOne(@Param('id') id: string, @Req() req) {
    // Access control: User can see their own info, or must be ADMIN / SUPERADMIN to see others
    if (req.user.role === Role.EMPLOYE && req.user.id !== id) {
      throw new ForbiddenException('Non autorisé à consulter le profil d\'un autre utilisateur');
    }
    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user profile (Owner or SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides ou email existant' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Update user password (Owner or SUPERADMIN)' })
  @ApiResponse({ status: 200, description: 'Mot de passe mis à jour' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto, @Req() req) {
    return this.usersService.updatePassword(id, updatePasswordDto.password, req.user);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Delete user account (SUPERADMIN only)' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  async remove(@Param('id') id: string, @Req() req) {
    return this.usersService.remove(id, req.user.id);
  }
}
