import { AuthService } from 'src/modules/user-accounts/application/auth-service';
import { UsersRepository } from 'src/modules/user-accounts/infrastructure/users/usersRepository';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
//todo реализовать refreshToken useCase

@Injectable()
class RefreshTokensCommand {
  constructor(
    public userId: string,
    public refreshToken: string,
  ) {}
}

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensUseCase implements ICommandHandler<RefreshTokensCommand> {
  constructor(
    private readonly authService: AuthService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({ userId, refreshToken }: RefreshTokensCommand) {
    const user = await this.usersRepository.findById(userId);
    if (!user?.refreshTokenHash) throw new UnauthorizedException();

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) throw new UnauthorizedException();

    const tokens = await this.authService.issueTokens(userId);

    // ротация: новый токен → новый хеш
    await this.usersRepository.updateRefreshTokenHash(
      userId,
      await bcrypt.hash(tokens.refreshToken, 10),
    );

    return tokens;
  }
}
