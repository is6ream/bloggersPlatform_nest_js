import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blogEntity';
import { BlogViewModel } from '../api/model/blogViewModel';

@Injectable
export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<> {
    const user: BlogDocument | null = await this.BlogModel.findOne({
      _id: id,
      deleteAt: null,
    });

    if (!user) {
      throw new NotFoundException('user not found!');
    }

    return UserViewDto.mapToView(user);
  }
  F;
}
