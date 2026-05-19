import { Injectable } from '@nestjs/common';
import { BlogsOrmEntity } from '../../blogs/infrastructure/entity/blog-orm.entity';
import { BlogsRepository } from '../../blogs/infrastructure/blogsRepository';
import { PostsRepository } from '../infrastructure/postsRepository';
import { CreatePostInputDto } from '../dto/input/createPostInputDto';
import { UpdatePostDto } from '../domain/dto/input/updatePostDto';
import { CreatePostForBlogInputDto } from '../../blogs/dto/input/createPostForBlogInputDto';
import { PostOrmEntity } from '../infrastructure/typeOrm/entity/post-orm.entity';

@Injectable()
export class PostsService {
  constructor(
    private blogsRepository: BlogsRepository,
    private postRepository: PostsRepository,
  ) {}

  async createPost(dto: CreatePostInputDto): Promise<string> {
    const blog: BlogsOrmEntity = await this.blogsRepository.findOrNotFoundFail(
      dto.blogId,
    );
    const post = PostOrmEntity.create({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName: blog.name,
    });

    await this.postRepository.save(post);

    return post.id;
  }

  async createPostForSpecificBlog(
    blogId: string,
    dto: CreatePostForBlogInputDto,
  ): Promise<string> {
    const blog: BlogsOrmEntity =
      await this.blogsRepository.findOrNotFoundFail(blogId);

    const post = PostOrmEntity.create({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId,
      blogName: blog.name,
    });

    await this.postRepository.save(post);

    return post.id;
  }

  async updatePost(id: string, dto: UpdatePostDto): Promise<void> {
    const post = await this.postRepository.findOrNotFoundFail(id);
    await this.blogsRepository.checkBlogExist(dto.blogId);

    post.updatePost(dto);

    await this.postRepository.save(post);
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.postRepository.findOrNotFoundFail(id);

    post.makeDeleted();

    await this.postRepository.save(post);
  }
}
