import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: "Pending" | "Done";
  type: "Homework" | "Plan";
  subject?: string;
  priority?: "Low" | "Medium" | "High";
  description?: string;
  category?: string;
  estimatedTime?: string;
  tags?: string[];
}

interface DashboardStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  dueToday: number;
  dueTomorrow: number;
  dueThisWeek: number;
  highPriority: number;
  completionRate: number;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    dueToday: 0,
    dueTomorrow: 0,
    dueThisWeek: 0,
    highPriority: 0,
    completionRate: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "today" | "week" | "overdue" | "high"
  >("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const apiUrl = "https://sheetdb.io/api/v1/rfau3x5t1i01p";

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }
    fetchTasks();
  }, [navigate]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const data = await res.json();
      const formattedTasks = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        dueDate: item.dueDate,
        status: item.status,
        type: item.type,
        subject: item.subject || "ทั่วไป",
        priority: item.priority || "Medium",
        description: item.description || "",
        estimatedTime: item.estimatedTime || "",
      }));
      setTasks(formattedTasks);
      calculateStats(formattedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (taskList: Task[]) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const completed = taskList.filter((t) => t.status === "Done").length;
    const total = taskList.length;

    const newStats: DashboardStats = {
      total: total,
      completed: completed,
      pending: taskList.filter((t) => t.status === "Pending").length,
      overdue: taskList.filter(
        (t) => t.status === "Pending" && t.dueDate < today
      ).length,
      dueToday: taskList.filter(
        (t) => t.status === "Pending" && t.dueDate === today
      ).length,
      dueTomorrow: taskList.filter(
        (t) => t.status === "Pending" && t.dueDate === tomorrow
      ).length,
      dueThisWeek: taskList.filter(
        (t) =>
          t.status === "Pending" && t.dueDate <= nextWeek && t.dueDate >= today
      ).length,
      highPriority: taskList.filter(
        (t) => t.status === "Pending" && t.priority === "High"
      ).length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };

    setStats(newStats);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/");
  };

  const getTasksByCategory = () => {
    const categories: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      const subject = task.subject || "ทั่วไป";
      if (!categories[subject]) categories[subject] = [];
      categories[subject].push(task);
    });
    return categories;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "สวัสดีตอนเช้า! 🌅";
    if (hour < 17) return "สวัสดีตอนบ่าย! ☀️";
    if (hour < 20) return "สวัสดีตอนเย็น! 🌇";
    return "สวัสดีตอนค่ำ! 🌙";
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "💪 ทำงานให้ดีที่สุด วันนี้ก็จะดีที่สุด!",
      "🌟 ความสำเร็จเริ่มต้นจากการลงมือทำ",
      "🎯 เป้าหมายใกล้แล้ว สู้ต่อไป!",
      "✨ ทุกวันคือโอกาสใหม่ที่จะทำให้ดีขึ้น",
      "🚀 ความพยายามวันนี้คือความสำเร็จวันพรุ่งนี้",
      "💎 เชื่อในศักยภาพของตัวเอง",
      "🌈 ทำวันนี้ให้ดีที่สุด!",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDueDate = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return `เกิน ${Math.abs(days)} วัน`;
    if (days === 0) return "วันนี้";
    if (days === 1) return "พรุ่งนี้";
    if (days <= 7) return `อีก ${days} วัน`;
    return new Date(dueDate).toLocaleDateString("th-TH", {
      month: "short",
      day: "numeric",
    });
  };

  const getUniqueSubjects = () => {
    const subjects = new Set<string>();
    tasks.forEach((task) => {
      if (task.subject) subjects.add(task.subject);
    });
    return Array.from(subjects).sort();
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filter by subject
    if (selectedSubject !== "all") {
      filtered = filtered.filter((t) => t.subject === selectedSubject);
    }

    // Filter by time/priority
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    switch (selectedFilter) {
      case "today":
        filtered = filtered.filter(
          (t) => t.status === "Pending" && t.dueDate === today
        );
        break;
      case "week":
        filtered = filtered.filter(
          (t) => t.status === "Pending" && t.dueDate <= nextWeek
        );
        break;
      case "overdue":
        filtered = filtered.filter(
          (t) => t.status === "Pending" && t.dueDate < today
        );
        break;
      case "high":
        filtered = filtered.filter(
          (t) => t.status === "Pending" && t.priority === "High"
        );
        break;
    }

    return filtered;
  };

  const todayTasks = tasks.filter(
    (t) =>
      t.status === "Pending" &&
      t.dueDate === new Date().toISOString().split("T")[0]
  );

  const overdueTasks = tasks.filter(
    (t) =>
      t.status === "Pending" &&
      t.dueDate < new Date().toISOString().split("T")[0]
  );

  const upcomingTasks = tasks
    .filter(
      (t) =>
        t.status === "Pending" &&
        t.dueDate > new Date().toISOString().split("T")[0]
    )
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-indigo-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-6 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-indigo-600">
                📊 Dashboard
              </h1>
              <p className="text-gray-700 mt-1 font-medium">{getGreeting()}</p>
              <p className="text-sm text-gray-500 mt-1">
                {getMotivationalQuote()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/homework")}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
              >
                📝 จัดการงาน
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Quick Stats Overview */}
        <div className="bg-indigo-600 rounded-2xl shadow-2xl p-6 mb-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold">{stats.completionRate}%</div>
              <div className="text-sm opacity-90 mt-1">อัตราความสำเร็จ</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{stats.dueToday}</div>
              <div className="text-sm opacity-90 mt-1">งานวันนี้</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{stats.overdue}</div>
              <div className="text-sm opacity-90 mt-1">เกินกำหนด</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">{stats.highPriority}</div>
              <div className="text-sm opacity-90 mt-1">ความสำคัญสูง</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-indigo-500 rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-90 mt-1">งานทั้งหมด</div>
          </div>
          <div className="bg-green-500 rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-3xl font-bold">{stats.completed}</div>
            <div className="text-sm opacity-90 mt-1">เสร็จแล้ว</div>
          </div>
          <div className="bg-yellow-500 rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <div className="text-sm opacity-90 mt-1">รอดำเนินการ</div>
          </div>
          <div className="bg-red-500 rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
            <div className="text-3xl mb-2">🚨</div>
            <div className="text-3xl font-bold">{stats.overdue}</div>
            <div className="text-sm opacity-90 mt-1">เกินกำหนด</div>
          </div>
          <div className="bg-blue-500 rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-3xl font-bold">{stats.dueToday}</div>
            <div className="text-sm opacity-90 mt-1">วันนี้</div>
          </div>
          <div className="bg-purple-500 rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-3xl font-bold">{stats.dueThisWeek}</div>
            <div className="text-sm opacity-90 mt-1">สัปดาห์นี้</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🔍 ตัวกรอง
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ช่วงเวลา
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedFilter === "all"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setSelectedFilter("today")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedFilter === "today"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  วันนี้
                </button>
                <button
                  onClick={() => setSelectedFilter("week")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedFilter === "week"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  สัปดาห์นี้
                </button>
                <button
                  onClick={() => setSelectedFilter("overdue")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedFilter === "overdue"
                      ? "bg-red-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  เกินกำหนด
                </button>
                <button
                  onClick={() => setSelectedFilter("high")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedFilter === "high"
                      ? "bg-orange-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ความสำคัญสูง
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วิชา
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition font-medium"
              >
                <option value="all">ทุกวิชา</option>
                {getUniqueSubjects().map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filtered Tasks List */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            📋 รายการงาน ({getFilteredTasks().length})
          </h3>
          {getFilteredTasks().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-xl text-gray-500 font-medium">
                ไม่มีงานในหมวดนี้!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredTasks()
                .sort((a, b) => {
                  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
                  const priorityDiff =
                    (priorityOrder[a.priority || "Medium"] || 1) -
                    (priorityOrder[b.priority || "Medium"] || 1);
                  if (priorityDiff !== 0) return priorityDiff;
                  return (
                    new Date(a.dueDate).getTime() -
                    new Date(b.dueDate).getTime()
                  );
                })
                .map((task) => {
                  const daysUntil = getDaysUntilDue(task.dueDate);
                  const isOverdue = daysUntil < 0;
                  const isToday = daysUntil === 0;
                  const isUrgent = daysUntil <= 3 && daysUntil >= 0;

                  return (
                    <div
                      key={task.id}
                      className={`border-2 rounded-xl p-4 transition transform hover:scale-105 hover:shadow-xl ${
                        isOverdue
                          ? "border-red-300 bg-red-50"
                          : isToday
                          ? "border-blue-300 bg-blue-50"
                          : isUrgent
                          ? "border-yellow-300 bg-yellow-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">
                            {task.type === "Homework" ? "📝" : "📅"}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getPriorityColor(
                              task.priority || "Medium"
                            )}`}
                          >
                            {task.priority === "High"
                              ? "🔥 สูง"
                              : task.priority === "Medium"
                              ? "⚡ ปานกลาง"
                              : "✅ ต่ำ"}
                          </span>
                        </div>
                        {task.status === "Done" && (
                          <span className="text-2xl">✅</span>
                        )}
                      </div>

                      <h4 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">
                        {task.title}
                      </h4>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📚</span>
                          <span className="font-medium text-gray-700">
                            {task.subject || "ไม่ระบุวิชา"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📅</span>
                          <span
                            className={`font-semibold ${
                              isOverdue
                                ? "text-red-600"
                                : isToday
                                ? "text-blue-600"
                                : isUrgent
                                ? "text-yellow-600"
                                : "text-gray-600"
                            }`}
                          >
                            {formatDueDate(task.dueDate)}
                          </span>
                        </div>

                        {task.description && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500">💬</span>
                            <span className="text-gray-600 text-xs line-clamp-2">
                              {task.description}
                            </span>
                          </div>
                        )}

                        {task.estimatedTime && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">⏱️</span>
                            <span className="text-gray-600 text-xs">
                              ใช้เวลาประมาณ {task.estimatedTime}
                            </span>
                          </div>
                        )}
                      </div>

                      {task.status === "Pending" && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 text-center">
                            {isOverdue ? (
                              <span className="text-red-600 font-bold">
                                ⚠️ ต้องทำด่วน!
                              </span>
                            ) : isToday ? (
                              <span className="text-blue-600 font-bold">
                                🎯 ต้องทำวันนี้!
                              </span>
                            ) : isUrgent ? (
                              <span className="text-yellow-600 font-bold">
                                ⚡ ใกล้ถึงกำหนด!
                              </span>
                            ) : (
                              <span className="text-green-600">
                                ✨ ยังมีเวลา
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Today's Tasks Summary */}
          <div className="bg-blue-500 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🎯 งานวันนี้
            </h3>
            <div className="text-5xl font-bold mb-2">{todayTasks.length}</div>
            <p className="text-blue-100">งานที่ต้องทำวันนี้</p>
            {todayTasks.length > 0 && (
              <div className="mt-4 space-y-2">
                {todayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="bg-white bg-opacity-20 rounded-lg p-2 text-sm"
                  >
                    <div className="font-medium truncate">{task.title}</div>
                    <div className="text-xs opacity-80">{task.subject}</div>
                  </div>
                ))}
                {todayTasks.length > 3 && (
                  <div className="text-xs text-center opacity-80">
                    และอีก {todayTasks.length - 3} งาน...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Overdue Tasks Summary */}
          <div className="bg-red-500 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🚨 งานเกินกำหนด
            </h3>
            <div className="text-5xl font-bold mb-2">{overdueTasks.length}</div>
            <p className="text-red-100">งานที่ล่าช้า</p>
            {overdueTasks.length > 0 && (
              <div className="mt-4 space-y-2">
                {overdueTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="bg-white bg-opacity-20 rounded-lg p-2 text-sm"
                  >
                    <div className="font-medium truncate">{task.title}</div>
                    <div className="text-xs opacity-80">
                      {task.subject} • เกิน{" "}
                      {Math.abs(getDaysUntilDue(task.dueDate))} วัน
                    </div>
                  </div>
                ))}
                {overdueTasks.length > 3 && (
                  <div className="text-xs text-center opacity-80">
                    และอีก {overdueTasks.length - 3} งาน...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Tasks Summary */}
          <div className="bg-purple-500 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              📅 งานที่จะมาถึง
            </h3>
            <div className="text-5xl font-bold mb-2">
              {upcomingTasks.length}
            </div>
            <p className="text-purple-100">งานในอนาคตใกล้</p>
            {upcomingTasks.length > 0 && (
              <div className="mt-4 space-y-2">
                {upcomingTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="bg-white bg-opacity-20 rounded-lg p-2 text-sm"
                  >
                    <div className="font-medium truncate">{task.title}</div>
                    <div className="text-xs opacity-80">
                      {task.subject} • {formatDueDate(task.dueDate)}
                    </div>
                  </div>
                ))}
                {upcomingTasks.length > 3 && (
                  <div className="text-xs text-center opacity-80">
                    และอีก {upcomingTasks.length - 3} งาน...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subject Categories */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">
            📚 งานแยกตามวิชา
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(getTasksByCategory()).map(
              ([subject, subjectTasks]) => {
                const pending = subjectTasks.filter(
                  (t) => t.status === "Pending"
                ).length;
                const completed = subjectTasks.filter(
                  (t) => t.status === "Done"
                ).length;
                const progress =
                  subjectTasks.length > 0
                    ? (completed / subjectTasks.length) * 100
                    : 0;

                return (
                  <div
                    key={subject}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                  >
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      {subject}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          ทั้งหมด: {subjectTasks.length}
                        </span>
                        <span className="text-green-600">
                          เสร็จ: {completed}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-600">รอ: {pending}</span>
                        <span className="text-blue-600">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-gray-700">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
