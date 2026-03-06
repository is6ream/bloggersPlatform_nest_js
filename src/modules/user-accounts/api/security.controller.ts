import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { RefreshTokenGuard } from '../guards/jwt/refresh-token.guard';
import { DeviceSessionsQueryRepository } from '../infrastructure/auth/device-sessions.query-repository';
import { DeviceSessionViewDto } from './dto/output/device-session.view-dto';
import { DeleteDeviceSessionCommand } from '../application/delete-device-session.usecase';

@Controller('security')
export class SecurityController {
  constructor(
    private readonly deviceSessionsQueryRepository: DeviceSessionsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async getDevices(@Req() req: Request): Promise<DeviceSessionViewDto[]> {
    const userId = (req.user as any).sub;
    const sessions = await this.deviceSessionsQueryRepository.findAllByUserId(userId);
    return sessions.map(DeviceSessionViewDto.mapToView);
  }

  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard)
  async deleteDevice(
    @Param('deviceId') deviceId: string,
    @Req() req: Request,
  ): Promise<void> {
    const userId = (req.user as any).sub;
    await this.commandBus.execute(new DeleteDeviceSessionCommand(userId, deviceId));
  }
}
