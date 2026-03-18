import { Query } from "mongoose";

class ApiFeatures {
  static paginate(query: Query<any, any>, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
  }
}

export default ApiFeatures;
