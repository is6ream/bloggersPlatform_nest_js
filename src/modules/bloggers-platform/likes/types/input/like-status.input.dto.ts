import { LikeStatus } from './../like-status';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LikeStatusInputDto {
  @ApiProperty({ enum: LikeStatus, enumName: 'LikeStatus' })
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}