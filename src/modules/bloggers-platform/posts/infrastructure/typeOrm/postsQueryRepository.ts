import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostOrmEntity } from './entity/post-orm.entity';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectRepository(PostOrmEntity)
    private readonly repo: Repository<PostOrmEntity>,
  ) {}
}
