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
import { CommandBus } from '@nestjs/cqrs';
import { RefreshTokenGuard } from '../guards/jwt/refresh-token.guard';
import { DeviceSessionsQueryRepository } from '../infrastructure/auth/device-sessions.query-repository';
import { DeviceSessionViewDto } from './dto/output/device-session.view-dto';
import { DeleteDeviceSessionCommand } from '../application/delete-device-session.usecase';
import { DeleteAllOtherSessionsCommand } from '../application/delete-all-other-sessions.usecase';
import { HttpRequestWithUser } from 'src/core/types/http.types';

type RefreshTokenRequestUser = {
  sub: string;
  deviceId: string;
};

@Controller('security')
export class SecurityController {
  constructor(
    private readonly deviceSessionsQueryRepository: DeviceSessionsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async getDevices(
    @Req() req: HttpRequestWithUser<RefreshTokenRequestUser>,
  ): Promise<DeviceSessionViewDto[]> {
    const userId = req.user!.sub;
    const sessions = await this.deviceSessionsQueryRepository.findAllByUserId(userId);
    return sessions.map(DeviceSessionViewDto.mapToView);
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard)
  async deleteAllOtherDevices(
    @Req() req: HttpRequestWithUser<RefreshTokenRequestUser>,
  ): Promise<void> {
    const userId = req.user!.sub;
    const deviceId = req.user!.deviceId;
    await this.commandBus.execute(new DeleteAllOtherSessionsCommand(userId, deviceId));
  }

  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard)
  async deleteDevice(
    @Param('deviceId') deviceId: string,
    @Req() req: HttpRequestWithUser<RefreshTokenRequestUser>,
  ): Promise<void> {
    const userId = req.user!.sub;
    await this.commandBus.execute(new DeleteDeviceSessionCommand(userId, deviceId));
  }
}
