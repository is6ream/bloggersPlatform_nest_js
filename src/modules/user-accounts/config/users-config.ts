import { Injectable } from '@nestjs/common';
import { IsBoolean, validateSync } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { configValidationUtility } from 'src/core/config/config-validation.utility';

@Injectable()
export class UserAccountsConfig {
  @IsBoolean({
    message: 'Set Env variable IS_USER_AUTOMATICALLY_CONFIRMED, example: false',
  })
  isAutomaticallyConfirmed: boolean =
    this.configService.getOrThrow('IS_USER_AUTOMATICALLY_CONFIRMED') === 'true';

  constructor(private configService: ConfigService) {
    configValidationUtility.validateConfig(this);
  }
}
