import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreatePostDto } from './dto/createPostDto';
import { HydratedDocument } from 'mongoose';
import { Model } from 'mongoose';
import { UpdatePostDto } from './dto/updatePostDto';
import {
  LikesInfo,
  LikesInfoSchema,
} from '../../likes/domain/likes-info.schema';
import { CreatePostDomainDto } from '../application/types/create-post-domain.dto';
@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false,
  },
})

export class PostEntity {
  @Prop({ type: String, required: true })
  public title: string;

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
  likesInfo: LikesInfo;

  static createInstance(
    this: PostModelType,
    dto: CreatePostDomainDto,
  ): PostDocument {
    const postData = {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: dto.blogName,
      deleteAt: null,
      likesInfo: {
        likesCount: 
      },
    };

    return new this(postData);
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
      },
    };
  }

  updateLikeCounter(oldLikeStatus: string, newLikeStatus: string) {
    if (oldLikeStatus === 'Like' && newLikeStatus === 'Dislike') {
      this.likesInfo.likesCount--;
      this.likesInfo.dislikesCount++;
    }
    if (oldLikeStatus === 'Like' && newLikeStatus === 'None') {
      this.likesInfo.likesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'Like') {
      this.likesInfo.likesCount++;
      this.likesInfo.dislikesCount--;
    }
    if (oldLikeStatus === 'Dislike' && newLikeStatus === 'None') {
      this.likesInfo.dislikesCount--;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Like') {
      this.likesInfo.likesCount++;
    }
    if (oldLikeStatus === 'None' && newLikeStatus === 'Dislike') {
      this.likesInfo.dislikesCount++;
    }
  }
}

export const PostSchema = SchemaFactory.createForClass(PostEntity);

PostSchema.loadClass(PostEntity);

export type PostDocument = HydratedDocument<PostEntity>;

export type PostModelType = Model<PostDocument> & typeof PostEntity;
