import { BaseQueryRequest } from "../utils/base-query.request";

export class GetEmployeesQueryRequest extends BaseQueryRequest {
  public get searchFilter() {
    if (!this.search) return {};
    return {
      $or: [
        { fullName: { $regex: this.search, $options: "i" } },
        { civilId: { $regex: this.search, $options: "i" } },
      ],
    };
  }
}
