import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SwitchCompanyDto } from './dto/switch-company.dto';
import { JwtAuthGuard } from './guards/auth.guard';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user in the system' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Utilisateur enregistré avec succès' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Requête ou données invalides' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate credentials and acquire JWT authorization token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Connexion réussie, token généré' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('switch-company')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch active company context for multi-company SUPERADMIN or ROOT without re-login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bascule réussie, nouveau token JWT généré' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Accès refusé pour cette entreprise' })
  async switchCompany(@Body() dto: SwitchCompanyDto, @Req() req) {
    const isRoot = req.isRootUser || req.user?.roles?.includes('ROOT') || false;
    return this.authService.switchCompany(req.user.id, dto.companyId, isRoot);
  }
}
