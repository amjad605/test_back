import { Document } from "../documents/document.model";
import { Task } from "../tasks/tasks.model";
import { AuditLog } from "../audit/audit.model";

class DashboardService {
  async getStaffDashboardData(user: any) {
    const now = new Date();

    const [pendingTasksCount, overdueTasks, recentActivity] = await Promise.all(
      [
        // 1. Pending tasks count (assigned to this user and status "Open" / "In Progress")
        Task.countDocuments({
          isDeleted: false,
          assignee: user.id,
          status: { $in: ["Open", "In Progress"] },
        }),

        // 2. Overdue tasks (past due date, not completed, assigned to this user, limit 5)
        Task.find({
          isDeleted: false,
          assignee: user.id,
          dueDate: { $ne: null, $lt: now },
          status: { $nin: ["Completed", "Cancelled", "Archived"] },
        })
          .sort({ dueDate: 1 })
          .limit(5)
          .populate("company", "name")
          .lean(),

        // 3. Recent activity logs (by this user only, last 5)
        AuditLog.find({ user: user.id })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("user", "name email")
          .lean(),
      ],
    );

    return {
      cards: {
        pendingTasks: pendingTasksCount,
      },
      overdueTasks,
      recentActivity,
    };
  }

  async getDashboardData(user: any) {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    const [
      expiryStats,
      estimatedFeesResult,
      pendingTasksCount,
      expiringDocuments,
      overdueTasks,
      recentActivity,
    ] = await Promise.all([
      // 1. Document expiry stats (expired, <30 days, <90 days)
      Document.aggregate([
        {
          $facet: {
            expired: [
              {
                $match: {
                  expiryDate: { $lt: now, $ne: null },
                  status: { $ne: "Under Renewal" },
                },
              },
              { $count: "count" },
            ],
            within30: [
              {
                $match: {
                  expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
                },
              },
              { $count: "count" },
            ],
            within90: [
              {
                $match: {
                  expiryDate: {
                    $gt: thirtyDaysFromNow,
                    $lte: ninetyDaysFromNow,
                  },
                },
              },
              { $count: "count" },
            ],
          },
        },
      ]),

      // 2. Estimated fees (sum of estimatedFee.amount for documents expiring within 30 days)
      Document.aggregate([
        {
          $match: {
            expiryDate: { $gte: now, $lte: thirtyDaysFromNow },
            "estimatedFee.amount": { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$estimatedFee.amount" },
          },
        },
      ]),

      // 3. Pending tasks count (not assigned or status "In Progress" / "Open")
      Task.countDocuments({
        isDeleted: false,
        $or: [
          { assignee: { $exists: false } },
          { assignee: null },
          { status: { $in: ["Open", "In Progress"] } },
        ],
      }),

      // 4. Documents expiring soon (last 5, sorted by expiry date ascending)
      Document.find({
        expiryDate: { $gte: now, $lte: ninetyDaysFromNow },
      })
        .sort({ expiryDate: 1 })
        .limit(5)
        .populate("ownerId", "name")
        .lean(),

      // 5. Overdue tasks (past due date, not completed, limit 5)
      Task.find({
        isDeleted: false,
        dueDate: { $lt: now },
        status: { $nin: ["Completed", "Cancelled", "Archived"] },
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate("company", "name")
        .lean(),

      // 6. Recent activity logs (last 5)
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email")
        .lean(),
    ]);

    // Parse expiry stats
    const stats = expiryStats[0] || {};
    const expiredCount = stats.expired?.[0]?.count || 0;
    const within30Count = stats.within30?.[0]?.count || 0;
    const within90Count = stats.within90?.[0]?.count || 0;

    // Parse estimated fees
    const estimatedFees = estimatedFeesResult[0]?.total || 0;

    // Compute doc status for the expiring documents table
    const expiringDocsWithStatus = expiringDocuments.map((doc: any) => {
      const expDate = new Date(doc.expiryDate);
      let status = "Valid";
      if (expDate < now) {
        status = "Expired";
      } else if (expDate <= thirtyDaysFromNow) {
        status = "Expiring Soon";
      } else if (expDate <= ninetyDaysFromNow) {
        status = "Expiring Soon";
      }
      return {
        ...doc,
        computedStatus: status,
      };
    });

    return {
      cards: {
        documentsExpiring: {
          expired: expiredCount,
          within30: within30Count,
          within90: within90Count,
        },
        estimatedFees,
        pendingTasks: pendingTasksCount,
      },
      expiringDocuments: expiringDocsWithStatus,
      overdueTasks,
      recentActivity,
    };
  }
}

export default new DashboardService();
