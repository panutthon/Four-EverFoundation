import { useState, useEffect, Fragment } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import type { Task, Subject } from "../types/app";
import { getTasks } from "../services/tasks";
import { getSubjects } from "../services/subjects";


import { updateTask } from "../services/tasks";
import { sendDiscordNotification, DISCORD_COLORS } from "../services/discord";
import { Navbar } from "../components/Navbar";

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
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksData, subjectsData] = await Promise.all([
        getTasks(),
        getSubjects(),
      ]);
      setTasks(tasksData);
      setSubjects(subjectsData);
      calculateStats(tasksData);
    } catch (error) {
      console.error("Error fetching data:", error);
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
        (t) => t.status === "Pending" && t.dueDate && t.dueDate < today
      ).length,
      dueToday: taskList.filter(
        (t) => t.status === "Pending" && t.dueDate === today
      ).length,
      dueTomorrow: taskList.filter(
        (t) => t.status === "Pending" && t.dueDate === tomorrow
      ).length,
      dueThisWeek: taskList.filter(
        (t) =>
          t.status === "Pending" && t.dueDate && t.dueDate <= nextWeek && t.dueDate >= today
      ).length,
      highPriority: taskList.filter(
        (t) => t.status === "Pending" && t.priority === "High"
      ).length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };

    setStats(newStats);
  };

  const toggleStatus = async (task: Task) => {
    const newStatus: "Pending" | "Done" = task.status === "Pending" ? "Done" : "Pending";

    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks as Task[]);
    calculateStats(updatedTasks);

    try {
      await updateTask(task.id, { status: newStatus });

      if (newStatus === "Done") {
        await sendDiscordNotification(
          "✅ งานเสร็จแล้วว!",
          "ดีใจด้วยที่รัก! เก่งมากค่ะ คนเก่งของเค้า 🎉",
          DISCORD_COLORS.SUCCESS,
          [
            { name: "📌 ชื่องาน", value: `\`\`\`${task.title}\`\`\``, inline: false },
            { name: "📚 วิชา", value: `\`\`\`${task.subject}\`\`\``, inline: false }
          ]
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      loadData(); // Revert on error
    }
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
        return "bg-pastel-red/20 text-red-600 border-pastel-red";
      case "Medium":
        return "bg-pastel-yellow/20 text-yellow-600 border-pastel-yellow";
      case "Low":
        return "bg-pastel-green/20 text-emerald-600 border-pastel-green";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "สวัสดีตอนเช้า! ค่ะที่รัก 🌅";
    if (hour < 17) return "สวัสดีตอนบ่าย! ค่ะที่รัก ☀️";
    if (hour < 20) return "สวัสดีตอนเย็น! ค่ะที่รัก 🌇";
    return "สวัสดีตอนค่ำ! ค่ะที่รัก 🌙";
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
    if (!dueDate) return 9999;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDueDate = (dueDate: string) => {
    if (!dueDate) return "ไม่ระบุ";
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
    <div className="min-h-screen bg-indigo-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <Navbar
        title={
          <Link
            to="/anniversary"
            className="inline-flex items-center gap-2 hover:underline cursor-pointer"
            aria-label="ไปหน้าครบรอบ"
          >
            📊 Dashboard
          </Link>
        }
        subtitle={getGreeting()}
        quote={getMotivationalQuote()}
        borderColor="border-pastel-pink"
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Quick Stats Overview */}
        <div className="bg-pastel-pink rounded-2xl shadow-2xl p-6 mb-8 text-white">
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
          <div className="bg-pastel-blue rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white ">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-90 mt-1">งานทั้งหมด</div>
          </div>
          <div className="bg-pastel-green rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-3xl font-bold">{stats.completed}</div>
            <div className="text-sm opacity-90 mt-1">เสร็จแล้ว</div>
          </div>
          <div className="bg-pastel-yellow rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <div className="text-sm opacity-90 mt-1">รอดำเนินการ</div>
          </div>
          <div className="bg-pastel-red rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
            <div className="text-3xl mb-2">🚨</div>
            <div className="text-3xl font-bold">{stats.overdue}</div>
            <div className="text-sm opacity-90 mt-1">เกินกำหนด</div>
          </div>
          <div className="bg-pastel-cyan rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-3xl font-bold">{stats.dueToday}</div>
            <div className="text-sm opacity-90 mt-1">วันนี้</div>
          </div>
          <div className="bg-pastel-purple rounded-xl p-5 shadow-lg hover:shadow-2xl transition transform hover:scale-105 text-white">
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
                  className={`px-4 py-2 rounded-lg font-medium transition ${selectedFilter === "all"
                    ? "bg-pastel-blue text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setSelectedFilter("today")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${selectedFilter === "today"
                    ? "bg-pastel-cyan text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  วันนี้
                </button>
                <button
                  onClick={() => setSelectedFilter("week")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${selectedFilter === "week"
                    ? "bg-pastel-purple text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  สัปดาห์นี้
                </button>
                <button
                  onClick={() => setSelectedFilter("overdue")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${selectedFilter === "overdue"
                    ? "bg-pastel-pink text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  เกินกำหนด
                </button>
                <button
                  onClick={() => setSelectedFilter("high")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${selectedFilter === "high"
                    ? "bg-pastel-red text-white shadow-lg"
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
              <Listbox
                value={selectedSubject}
                onChange={setSelectedSubject}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-pastel-blue transition shadow-sm">
                    <span className="block truncate font-medium text-gray-700">
                      {selectedSubject === "all"
                        ? "ทุกวิชา"
                        : subjects.find((s) => s.name === selectedSubject)?.name ||
                        selectedSubject}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      <Listbox.Option
                        key="all"
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active
                            ? "bg-indigo-100 text-indigo-900"
                            : "text-gray-900"
                          }`
                        }
                        value="all"
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${selected ? "font-bold" : "font-normal"
                                }`}
                            >
                              ทุกวิชา
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                      {subjects.map((subject) => (
                        <Listbox.Option
                          key={subject.id}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active
                              ? "bg-pastel-blue/20 text-gray-900"
                              : "text-gray-900"
                            }`
                          }
                          value={subject.name}
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${selected ? "font-bold" : "font-normal"
                                  }`}
                              >
                                {subject.name}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-pastel-blue">
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
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
                  // 1. Status: Pending first
                  if (a.status !== b.status) {
                    return a.status === "Pending" ? -1 : 1;
                  }

                  // 2. Pending Tasks Sorting
                  if (a.status === "Pending") {
                    // Handle empty dates: Push to bottom of Pending
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;

                    // Sort by Date Ascending (Near due first)
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                  }

                  // 3. Done Tasks Sorting (Optional: Date Descending?)
                  return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
                })
                .map((task) => {
                  const daysUntil = getDaysUntilDue(task.dueDate);
                  const isOverdue = daysUntil < 0;
                  const isToday = daysUntil === 0;
                  const isUrgent = daysUntil <= 3 && daysUntil >= 0;

                  return (
                    <div
                      key={task.id}
                      className={`border-2 rounded-xl p-4 transition transform hover:scale-105 hover:shadow-xl ${isOverdue
                        ? "border-pastel-red bg-pastel-red/10"
                        : isToday
                          ? "border-pastel-blue bg-pastel-blue/10"
                          : isUrgent
                            ? "border-pastel-yellow bg-pastel-yellow/10"
                            : "border-gray-200 bg-white"
                        }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatus(task)}
                            className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${task.status === "Done"
                              ? "bg-green-500 border-green-500 text-white"
                              : "bg-white border-gray-300 hover:border-purple-500"
                              }`}
                          >
                            {task.status === "Done" && (
                              <CheckIcon className="h-6 w-6" strokeWidth={3} />
                            )}
                          </button>
                          <span className="text-3xl">
                            {task.type === "Homework" ? "📝" : task.type === "Plan" ? "📅" : "👥"}
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
                            className={`font-semibold ${isOverdue
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

                        {task.tags && (typeof task.tags === 'string' ? task.tags.split(',') : Array.isArray(task.tags) ? task.tags : []).filter((t: string) => t.trim()).length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-gray-500">🏷️</span>
                            <div className="flex flex-wrap gap-1">
                              {(typeof task.tags === 'string' ? task.tags.split(',') : task.tags).map((tag: string, index: number) => (
                                <span key={index} className="bg-teal-100 text-teal-700 text-[10px] px-2 py-0.5 rounded-full font-medium border border-teal-200">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
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
          <div className="bg-pastel-blue rounded-xl shadow-lg p-6 text-white">
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
                    className="bg-white rounded-lg p-2 text-sm shadow-sm"
                  >
                    <div className="font-medium truncate text-gray-800">{task.title}</div>
                    <div className="text-xs text-gray-500">{task.subject}</div>
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
          <div className="bg-pastel-red rounded-xl shadow-lg p-6 text-white">
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
                    className="bg-white rounded-lg p-2 text-sm shadow-sm"
                  >
                    <div className="font-medium truncate text-gray-800">{task.title}</div>
                    <div className="text-xs text-gray-500">
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
          <div className="bg-pastel-purple rounded-xl shadow-lg p-6 text-white">
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
                    className="bg-white rounded-lg p-2 text-sm shadow-sm"
                  >
                    <div className="font-medium truncate text-gray-800">{task.title}</div>
                    <div className="text-xs text-gray-500">
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
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
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
                          className="bg-pastel-green h-2 rounded-full transition-all duration-300"
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
