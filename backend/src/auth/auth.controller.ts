import { Controller, Post, Get, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/register -> Registers a user
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  async register(@Body() registerDto: RegisterDto & { startTrial?: boolean }) {
    const { name, email, password } = registerDto;
    return this.authService.register(name, email, password, {
      startTrial: registerDto.startTrial !== false,
    });
  }

  @Post('free-trial')
  @ApiOperation({ summary: 'Create an account with a 2-day Premium trial and return an access token' })
  @ApiResponse({ status: 201, description: 'Trial account created and signed in.' })
  async startFreeTrial(@Body() body: { name: string; email: string; password: string }) {
    return this.authService.register(body.name, body.email, body.password, {
      startTrial: true,
      returnToken: true,
    });
  }

  // POST /auth/login -> Logs in a user, returns access token
  @Post('login')
  @ApiOperation({ summary: 'User Login' })
  @ApiResponse({ status: 200, description: 'Successfully logged in. Returns access token.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  async login(@Body() loginDto: LoginDto & { username?: string }) {
    const identifier = (loginDto.email || loginDto.username || '').trim();
    return this.authService.login(identifier, loginDto.password);
  }

  @Post('google')
  @ApiOperation({ summary: 'Sign in or register with a Google ID token' })
  @ApiResponse({ status: 200, description: 'Successfully signed in. Returns access token.' })
  @ApiResponse({ status: 401, description: 'Google token invalid.' })
  async googleLogin(@Body() body: { credential?: string; idToken?: string; accessToken?: string }) {
    return this.authService.loginWithGoogle({
      idToken: body.credential || body.idToken,
      accessToken: body.accessToken,
    });
  }

  @Post('inspector-login')
  @ApiOperation({ summary: 'Inspector (view-only) login with username and password' })
  @ApiResponse({ status: 200, description: 'Successfully logged in. Returns access token.' })
  @ApiResponse({ status: 401, description: 'Invalid username or password.' })
  async inspectorLogin(@Body() body: { username?: string; email?: string; password: string }) {
    return this.authService.inspectorLogin(body.username || body.email || '', body.password);
  }

  // GET /auth/profile -> Returns user profile if authorized
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiBearerAuth() // Allows passing JWT token in Swagger UI
  @ApiOperation({ summary: 'Get current user profile (requires JWT)' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('viewers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List inspector (view-only) logins for this farm owner' })
  listViewers(@Request() req: any) {
    this.authService.assertOwner(req.user);
    return this.authService.listViewers(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('viewers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an inspector username and password (view-only)' })
  createViewer(
    @Body() body: { name: string; username: string; password: string },
    @Request() req: any,
  ) {
    this.authService.assertOwner(req.user);
    return this.authService.createViewer(req.user.id, body.name, body.username, body.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('viewers/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an inspector login' })
  removeViewer(@Param('id') id: string, @Request() req: any) {
    this.authService.assertOwner(req.user);
    return this.authService.removeViewer(req.user.id, Number(id));
  }

}
