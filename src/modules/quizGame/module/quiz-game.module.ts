import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameOrmEntity } from '../entities/game.orm-entity';
import { PlayerOrmEntity } from '../entities/player.orm-entity';
import { QuestionOrmEntity } from '../entities/question.orm-entity';
import { UserOrmEntity } from '../entities/user.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameOrmEntity, PlayerOrmEntity, QuestionOrmEntity, UserOrmEntity])],
})
export class QuizGameModule {}
