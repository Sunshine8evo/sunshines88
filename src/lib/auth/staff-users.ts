export type StaffUser = {
  username: string;
  password: string;
  email: string;
  role: "owner" | "manager" | "reception" | "staff" | "ss_team";
  name: string;
  displayName: string;
};

export type PublicStaffUser = Omit<StaffUser, "password" | "email">;

export const DEFAULT_STAFF_USERS: StaffUser[] = [
  {
    username: "owner",
    password: "owner123",
    email: "owner@sunshines88.com",
    role: "owner",
    name: "Owner",
    displayName: "Owner Admin",
  },
  {
    username: "sunshines1",
    password: "Bowvy",
    email: "sunshines1@sunshines88.com",
    role: "owner",
    name: "Sunshine Test Owner",
    displayName: "Sunshines1",
  },
  {
    username: "sunshines",
    password: "Bowvy",
    email: "sunshines@sunshines88.com",
    role: "ss_team",
    name: "Sunshines",
    displayName: "Sunshines",
  },
  {
    username: "manager",
    password: "mgr123",
    email: "manager@sunshines88.com",
    role: "manager",
    name: "Manager",
    displayName: "Manager",
  },
  {
    username: "reception",
    password: "rec123",
    email: "reception@sunshines88.com",
    role: "reception",
    name: "Reception",
    displayName: "Reception",
  },
  {
    username: "staff",
    password: "staff123",
    email: "staff@sunshines88.com",
    role: "staff",
    name: "Pam",
    displayName: "Pam (Staff)",
  },
  {
    username: "pam",
    password: "pam123",
    email: "pam@sunshines88.com",
    role: "staff",
    name: "Pam",
    displayName: "Pam",
  },
  {
    username: "noon",
    password: "noon123",
    email: "noon@sunshines88.com",
    role: "staff",
    name: "Noon",
    displayName: "Noon",
  },
  {
    username: "min",
    password: "min123",
    email: "min@sunshines88.com",
    role: "staff",
    name: "Min",
    displayName: "Min",
  },
  {
    username: "jane",
    password: "jane123",
    email: "jane@sunshines88.com",
    role: "staff",
    name: "Jane",
    displayName: "Jane",
  },
  {
    username: "mumu",
    password: "2810",
    email: "mumu@sunshines88.com",
    role: "manager",
    name: "Mumu",
    displayName: "Mumu",
  },
  {
    username: "piglet",
    password: "2810",
    email: "piglet@sunshines88.com",
    role: "owner",
    name: "Piglet",
    displayName: "Piglet",
  },
];

export function toPublicUser(user: StaffUser): PublicStaffUser {
  return {
    username: user.username,
    role: user.role,
    name: user.name,
    displayName: user.displayName,
  };
}
