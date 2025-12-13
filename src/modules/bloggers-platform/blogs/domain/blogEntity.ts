import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateBlogDto } from '../dto/input/createBlogDto';
import { HydratedDocument, Model } from 'mongoose';
import { UpdateBlogDto } from '../dto/input/updateBlogDto';

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: false,
  },
})
export class Blog {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: true })
  websiteUrl: string;

  @Prop({ type: Date, nullable: true, default: null })
  deleteAt: Date | null;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Boolean, required: true, default: true })
  static createInstance(dto: CreateBlogDto) {
    const blog = new this();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;

    return blog as BlogDocument;
  }

  updateBlog(dto: UpdateBlogDto): void {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }

  makeDeleted() {
    if (this.deleteAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deleteAt = new Date();
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.loadClass(Blog);

export type BlogDocument = HydratedDocument<Blog>;

export type BlogModelType = Model<BlogDocument> & typeof Blog;
