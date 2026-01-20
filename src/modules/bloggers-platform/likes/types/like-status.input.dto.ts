import { LikeStatus } from './like-status';
import { IsEnum, IsNotEmpty } from 'class-validator';
export class LikeStatusInputDto {
  @IsNotEmpty()
  @IsEnum(LikeStatus)
  likeStatus: LikeStatus;
}
