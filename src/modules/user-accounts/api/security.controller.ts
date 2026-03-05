import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RefreshTokenGuard } from '../guards/jwt/refresh-token.guard';
import { DeviceSessionsQueryRepository } from '../infrastructure/auth/device-sessions.query-repository';
import { DeviceSessionViewDto } from './dto/output/device-session.view-dto';

@Controller('security')
export class SecurityController {
  constructor(
    private readonly deviceSessionsQueryRepository: DeviceSessionsQueryRepository,
  ) {}

  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async getDevices(@Req() req: Request): Promise<DeviceSessionViewDto[]> {
    const userId = (req.user as any).sub;
    const sessions = await this.deviceSessionsQueryRepository.findAllByUserId(userId);
    return sessions.map(DeviceSessionViewDto.mapToView);
  }
}
