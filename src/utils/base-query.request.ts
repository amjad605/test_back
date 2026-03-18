export class BaseQueryRequest {
  public search?: string;
  public page: number;
  public limit: number;
  public sort?: string;
  public filter: Record<string, any>;

  constructor(query: any) {
    this.search = query.search as string;
    this.page = Math.max(1, Number(query.page) || 1);
    this.limit = Math.max(1, Number(query.limit) || 10);
    this.sort = query.sort as string;

    const filterObj = { ...query };
    const excludedFields = ["page", "sort", "limit", "search"];
    excludedFields.forEach((field) => delete filterObj[field]);
    this.filter = filterObj;
  }
}
