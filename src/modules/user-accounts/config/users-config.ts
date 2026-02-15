import { Injectable } from '@nestjs/common';
import { IsBoolean, validateSync } from 'class-validator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserAccountsConfig {
  @IsBoolean({
    message: 'Set Env variable IS_USER_AUTOMATICALLY_CONFIRMED, example: false',
  })
  isAutomaticallyConfirmed: boolean =
    this.configService.getOrThrow('IS_USER_AUTOMATICALLY_CONFIRMED') === 'true';

  constructor(private configService: ConfigService) {
    const errors = validateSync(this);
    if (errors.length > 0) {
      const sortedMessages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new Error('Validation failed: ' + sortedMessages);
    }
  }
}
