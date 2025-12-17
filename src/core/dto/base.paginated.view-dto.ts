//класс view модели для запросов за списком с пагинацией
/**этот класс абстрактный, дженериком мы
 * можем передавать любые типы данных (items блогов или постов)
 */
export abstract class PaginatedViewDto<T> {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  abstract items: T[];

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
