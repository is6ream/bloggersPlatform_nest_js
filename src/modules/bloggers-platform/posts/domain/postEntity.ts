import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreatePostDto } from './dto/createPostDto';
import { HydratedDocument } from 'mongoose';
import { Model } from 'mongoose';
import { UpdatePostDto } from './dto/updatePostDto';
import { LikesInfoSchema } from '../../likes/domain/likes-info.schema';
import { LikesInfo } from '../../likes/domain/likes-info.schema';
@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false,
  },
})
export class PostMethods {}

export class Post {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  shortDescription: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  blogId: string;

  @Prop({ type: String, required: true })
  blogName: string;

  @Prop({ type: Date, nullable: true, default: null })
  deleteAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: LikesInfoSchema, required: true })
  extendedLikesInfo: LikesInfo;

  static createInstance(dto: CreatePostDto) {
    const post = new this();
    post.title = dto.title;
    post.shortDescription = dto.shortDescription;
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;

    return post as PostDocument;
  }

  updatePost(dto: UpdatePostDto): void {
    this.title = dto.title;
    this.shortDescription = dto.shortDescription;
    this.content = dto.content;
  }

  makeDeleted() {
    if (this.deleteAt !== null) {
      throw new Error('Post already deleted');
    }
    this.deleteAt = new Date();
  }

  toViewModel(id: string) {
    return {
      id: id,
      title: this.title,
      shortDescription: this.shortDescription,
      content: this.content,
      blogId: this.blogId,
      blogName: this.blogName,
      createdAt: this.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }

  updateLikeCounter(
    oldLikeStatus: string,
    newLikeStatus: string,
  ) {
    //rolecheck, валидация,
    if (oldLikeStatus === 'Like' && newLikeStatus === 'Dislike') {
      this.extendedLikesInfo.likesCount--;
      this.extendedLikesInfo.dislikesCount++;
    }
    if (oldLikeStatus === 'Like' && newLikeStatus === 'None') {
      this.extendedLikesInfo.likesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'Like') {
      this.extendedLikesInfo.likesCount++;
      this.extendedLikesInfo.dislikesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'None') {
      this.extendedLikesInfo.dislikesCount--;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Like') {
      this.extendedLikesInfo.likesCount++;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Dislike') {
      this.extendedLikesInfo.dislikesCount++;
    }
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post); //посмотреть документацию

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument> & typeof Post;
