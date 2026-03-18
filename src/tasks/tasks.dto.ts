import {
  ITaskAttachment,
  TaskStatus,
  TaskType,
  TasksPriority,
} from "./tasks.model";
export interface CreateTaskDto {
  title: string;
  description?: string;
  type: TaskType;
  priority: TasksPriority;
  assignee: string;
  dueDate?: Date;
  employeeId?: string;
  documentId?: string;
  workflowStep?: string;
  companyId?: string;
  isClientVisible?: boolean;
  estimatedFee?: number;
  actualFee?: number;
  deliverable?: string;
  attachments: ITaskAttachment[];
}
export interface UpdateTasksDto extends Partial<CreateTaskDto> {
  status?: TaskStatus;
}
