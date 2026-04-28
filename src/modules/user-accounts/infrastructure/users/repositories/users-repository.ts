import { UserOrmEntity } from './../entities/user.orm-entity';
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";

@Injectable()
export class UsersRepository {
    constructor(
        @InjectRepository(UserOrmEntity)
        private readonly repo: Repository<UserOrmEntity>
    ) { }

    async findById(id: string): Promise<UserOrmEntity | null> {
        return this.repo.findOne({ where: { id: id } })
    }

    async findByLogin(login: string): Promise<UserOrmEntity | null> {
        return this.repo.findOne({ where: { login: login } })
    }

    async save(user: UserOrmEntity): Promise<void> {
        await this.repo.save(user);
    }
}