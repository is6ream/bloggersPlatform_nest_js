import { CreateBlogDto } from './../../dto/input/createBlogDto';
import { BaseDBEntity } from "src/core/database/base-db.entity";
import { Column, Entity } from "typeorm";
import { UpdateBlogDto } from "../../dto/input/updateBlogDto";
import { randomUUID } from 'crypto';



@Entity('blogs')
export class BlogsOrmEntity extends BaseDBEntity {
    @Column({ type: 'varchar', length: 15 })
    name!: string;

    @Column({ type: 'varchar', length: 500 })
    description!: string;

    @Column({ type: 'varchar', name: 'websiteUrl', length: 100 })
    websiteUrl: string;

    @Column({ type: 'boolean', default: false })
    isMembership: boolean

    @Column({ type: 'timestamptz', nullable: true, default: null })
    deleteAt: Date | null

    makeDeleted(): void {
        if (this.deleteAt !== null) {
            throw new Error('Entity already deleted');
        }
        this.deleteAt = new Date()
    }

    update(dto: UpdateBlogDto): void {
        this.name = dto.name
        this.description = dto.description
        this.websiteUrl = dto.websiteUrl
    }

    static create(dto: CreateBlogDto): BlogsOrmEntity {
        const blog = new BlogsOrmEntity();

        blog.id = randomUUID();
        blog.name = dto.name;
        blog.description = dto.description;
        blog.websiteUrl = dto.websiteUrl;
        blog.isMembership = false;
        blog.deleteAt = null;

        return blog;
    }
} 