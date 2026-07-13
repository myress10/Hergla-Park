import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
}
