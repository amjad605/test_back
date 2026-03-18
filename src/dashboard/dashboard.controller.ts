import { Response } from "express";
import { AsyncWrapper } from "../utils/AsyncWrapper";
import { AuthenticatedRequest } from "../auth/auth.service";
import dashboardService from "./dashboard.service";

class DashboardController {
  getDashboard = AsyncWrapper(
    async (req: AuthenticatedRequest, res: Response) => {
      let data;
      if (req.user?.role === "Staff" || req.user?.role === "HR") {
        data = await dashboardService.getStaffDashboardData(req.user);
      } else {
        data = await dashboardService.getDashboardData(req.user);
      }

      res.status(200).json({
        status: "success",
        data,
      });
    },
  );
}

export default new DashboardController();
