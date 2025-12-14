import { Controller, Get, Query } from '@nestjs/common';
import { GetPostsQueryParams } from './query/get-posts-query-params';

@Controller('posts')
export class PostsController {
  constructor(){}

  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<>
}
