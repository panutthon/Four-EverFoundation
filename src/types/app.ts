export interface Task {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  status: "Pending" | "Done";
  type: "Homework" | "Plan";
  subject: string;
  priority: "Low" | "Medium" | "High";
  description?: string;
  estimatedTime?: string;
  createdAt?: number;
  updatedAt?: number;
  tags?: string[];
  reminders?: number[]; // Array of timestamps for notifications
}

export interface Subject {
  id: string;
  name: string;
}
