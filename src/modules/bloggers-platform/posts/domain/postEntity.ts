import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreatePostDto } from './dto/createPostDto';
import { HydratedDocument } from 'mongoose';
import { Model } from 'mongoose';
import { UpdatePostDto } from './dto/updatePostDto';

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false,
  },
})
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
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument> & typeof Post;
