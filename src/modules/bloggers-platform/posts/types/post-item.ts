import { ExtendedLikesInfoDto} from 'src/modules/bloggers-platform/likes/types/output/extended-likes.dto';

export interface PostItem {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: ExtendedLikesInfoDto;
}
