export interface Task {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  status: "Pending" | "Done";
  type: "Homework" | "Plan" | "Group Work";
  subject: string;
  priority: "Low" | "Medium" | "High";
  description?: string;
  estimatedTime?: string;
  createdAt?: number;
  updatedAt?: number;
  tags?: string | string[];
  reminders?: number[]; // Array of timestamps for notifications
}

export interface Subject {
  id: string;
  name: string;
}

export interface ClassSchedule {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subject: string;
  room?: string;
  note?: string;
}
