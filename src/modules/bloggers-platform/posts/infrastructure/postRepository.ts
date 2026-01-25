import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostEntity, PostDocument, PostModelType } from '../domain/postEntity';
import { NotFoundException } from '@nestjs/common';
import { DomainException } from 'src/core/exceptions/domain-exceptions';
import { LikeDocument } from '../../likes/domain/like-entity';
@Injectable()
export class PostRepository {
  constructor(@InjectModel(PostEntity.name) private PostModel: PostModelType) {}

  async findById(id: string): Promise<PostDocument | null> {
    return this.PostModel.findOne({
      _id: id,
      deleteAt: null,
    });
  }

  async save(post: PostDocument) {
    await post.save();
  }
  async findOrNotFoundFail(id: string): Promise<PostDocument> {
    const post = await this.findById(id);
    if (!post) {
      console.log('post not found check');
      throw new DomainException({ code: 1, message: 'Post not found' });
    }
    return post;
  }

  async checkPostExist(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) {
      throw new NotFoundException(`post with id: ${id} not found `);
    }
  }

  async findOrThrowValidationError(id: string): Promise<PostDocument> {
    const post = await this.findById(id);
    if (!post) {
      throw new DomainException({ code: 2, message: 'Post not found' });
    }
    return post;
  }

  async likeStatusSave(like: LikeDocument): Promise<void> {
    await like.save();
  }
}
