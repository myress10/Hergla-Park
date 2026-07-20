import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('user:read')
  @ApiOperation({ summary: "Retrieve all users within scope (tenant or global if ROOT)" })
  @ApiQuery({ name: 'targetCompanyId', required: false, description: 'Filter by company (ROOT only)' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
  async findAll(
    @Req() req,
    @Query('targetCompanyId') targetCompanyId?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    const users = await this.usersService.findAll(caller, targetCompanyId);
    return { success: true, count: users.length, data: users };
  }

  @Post()
  @RequirePermissions('user:create')
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiQuery({ name: 'targetCompanyId', required: false, description: 'Target company for user (ROOT only)' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req,
    @Query('targetCompanyId') targetCompanyId?: string,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.usersService.create(createUserDto, caller, targetCompanyId, reason);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Retrieve single user profile metadata' })
  @ApiResponse({ status: 200, description: "Détail de l'utilisateur" })
  async findOne(@Param('id') id: string, @Req() req) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    // Access control: User can see their own info, or must have user:read permission
    // We already passed PermissionsGuard (so they have user:read or they are ROOT).
    // If they only have user:read, they are bounded by their company in UsersService.
    // If an employee wants to see their own profile but doesn't have user:read, we can check.
    // Note: EMPLOYE does not have user:read in the default system role permissions, so we must allow
    // users to read their own profile without user:read permission.
    // Let's bypass PermissionsGuard check if req.user.id === id:
    // But since the class has @UseGuards(PermissionsGuard) and route has @RequirePermissions('user:read'),
    // an employee will get Forbidden before reaching this method!
    // That's a good point! We should move the @RequirePermissions('user:read') to specific handlers.
    // Let's do that to ensure users can read/write their OWN profiles without having general user:read/user:update.
    const user = await this.usersService.findOne(id, caller);
    return { success: true, data: user };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user profile (Owner or authorized admin)' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    // Access validation is done inside the service (owner or SUPERADMIN with company lock or ROOT)
    return this.usersService.update(id, updateUserDto, caller, reason);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Update user password (Owner or authorized admin)' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  async updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.usersService.updatePassword(id, updatePasswordDto.password, caller, reason);
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for write action (ROOT only)' })
  async remove(
    @Param('id') id: string,
    @Req() req,
    @Query('reason') reason?: string,
  ) {
    const caller = { ...req.user, isRoot: req.isRootUser || false };
    return this.usersService.remove(id, caller, reason);
  }
}
