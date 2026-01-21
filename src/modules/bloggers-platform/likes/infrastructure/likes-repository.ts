import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument } from '../domain/like-entity';
import { LikeModelType } from '../domain/like-entity';
@Injectable()
export class LikesRepository {
  constructor(@InjectModel(Like.name) private LikeModel: LikeModelType) {}

  async likeStatusSave(like: LikeDocument) {
    await like.save();
  }

  async findByUserId(userId: string) {
    return this.LikeModel.find({ userId });
  }
}
