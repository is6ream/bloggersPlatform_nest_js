import { NewestLikeDto } from 'src/modules/bloggers-platform/likes/types/output/newest-likes.dto';

export class ExtendedLikesInfoDto {
  constructor(
    public likesCount: number,
    public dislikesCount: number,
    public myStatus: string,
    public newestLikes: NewestLikeDto[],
  ) {}
}
