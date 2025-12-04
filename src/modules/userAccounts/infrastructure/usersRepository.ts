import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../domain/userEntity';
//остановился  на настройке импортов в этом слое, продолжить рефакторинг

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name))
}
