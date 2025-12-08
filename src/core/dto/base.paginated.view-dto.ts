//класс view модели для запросов за списком с пагинацией
/**этот класс абстрактный, дженериком мы
 * можем передавать любые типы данных (items блогов или постов)
 * я не могу использовать его напрямую, даллее
 * он от него будут наследоваться классы для
 * view models блогов и постов
 */
export abstract class PaginatedViewDto<T> {
  abstract items: T[];
  totalCount: number;
  pagesCount: number;
  page: number;
  pageSize: number;

  //статический метод-утилита для маппинга
  public static mapToView<T>(data: {
    items: T[];
    page: number;
    size: number;
    totalCount: number;
  }): PaginatedViewDto<T> {
    return {
      totalCount: data.totalCount,
      pagesCount: Math.ceil(data.totalCount / data.size),
      page: data.page,
      pageSize: data.size,
      items: data.items,
    };
  }
}
