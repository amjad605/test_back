export interface CreateInternalUserDto {
  email: string;
  password: string;
  role: "Owner" | "Staff" | "Client" | "HR";
  companyId: string;

  fullName: string; // Used as 'name' for User and 'fullName' for Employee
  civilId: string;
  nationality?: string;
  phoneNumber?: string;
  jobTitle: string;
  department?: string;
  hiringDate?: Date;
  contractType?: "Limited" | "Unlimited" | "Project-based";

  salary: {
    basic: number;
    allowances: number;
    currency: string;
  };

  status: "Active" | "On Leave" | "Suspended" | "Terminated";
  probationEndDate?: Date;
  leaveBalance: number;
  internalNotes?: string;
}

export interface UpdateInternalUserDto extends CreateInternalUserDto {}
