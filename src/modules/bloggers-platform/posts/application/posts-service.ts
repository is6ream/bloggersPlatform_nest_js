import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostDocument, PostModelType } from '../domain/postEntity';
import { Post } from '../domain/postEntity';
import { BlogDocument } from '../../blogs/domain/blogEntity';
import { BlogsRepository } from '../../blogs/infrastructure/blogsRepository';
import { PostRepository } from '../infrastructure/postRepository';
import { CreatePostInputDto } from '../dto/input/createPostInputDto';
import { UpdatePostDto } from '../domain/dto/updatePostDto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private blogsRepository: BlogsRepository,
    private postRepository: PostRepository,
  ) {}

  async createPost(dto: CreatePostInputDto): Promise<string> {
    const blog: BlogDocument = await this.blogsRepository.findOrNotFoundFail(
      dto.blogId,
    );
    const post: PostDocument = this.PostModel.createInstance({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blog.name,
    });

    await this.postRepository.save(post);

    return post._id.toString();
  }

  async updatePost(id: string, dto: UpdatePostDto): Promise<void> {
    const post: PostDocument = await this.postRepository.findOrNotFoundFail(id);
    await this.blogsRepository.checkBlogExist(dto.blogId);

    post.updatePost(dto);

    await this.postRepository.save(post);
    return;
  }
}
