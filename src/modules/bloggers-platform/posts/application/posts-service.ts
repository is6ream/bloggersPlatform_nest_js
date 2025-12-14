import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostDocument, PostModelType } from '../domain/postEntity';
import { Post } from '../domain/postEntity';
import { CreatePostDto } from '../domain/dto/createPostDto';
import { BlogDocument, BlogModelType } from '../../blogs/domain/blogEntity';
import { BlogsRepository } from '../../blogs/infrastructure/blogsRepository';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private blogsRepository: BlogsRepository
    private PostRepository: PostRepository,
  ) {}

  async createPost(dto: CreatePostDto): Promise<string> {
    const blog: BlogDocument = await this.blogsRepository.findOrNotFoundFail(dto.blogId)
    const post: PostDocument = this.PostModel.createInstance({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blog.name,
    });

    
  }
}
