import { ArrayMinSize, IsArray, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateQuestionInputDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @Length(10, 500) // уточни лимиты по ТЗ
    body: string;
    @Transform(({ value }) =>
        Array.isArray(value)
            ? value.map((v) => (typeof v === 'string' ? v.trim() : v))
            : value,
    )
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    @Length(1, 1000, { each: true })
    correctAnswers: string[];
}