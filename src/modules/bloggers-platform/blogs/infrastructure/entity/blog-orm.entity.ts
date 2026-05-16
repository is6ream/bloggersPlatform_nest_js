import { BaseDBEntity } from "src/core/database/base-db.entity";
import { Column, Entity } from "typeorm";



@Entity('blogs')
export class BlogsOrmEntity extends BaseDBEntity {
    @Column({ type: 'varchar', length: 15 })
    name!: string;

    @Column({ type: 'varchar', length: 255 })
    description!: string;

    @Column({ type: 'varchar', length: 100 })
    websiteUrl: string;

    @Column({ type: 'boolean', default: false })
    isMembership: boolean

    @Column({ type: 'timestamptz', nullable: true, default: null})
    deleteAt: Date
} 