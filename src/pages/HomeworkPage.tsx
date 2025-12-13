import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Listbox, Transition, Dialog } from "@headlessui/react";
import {
  ChevronUpDownIcon,
  CheckIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { CalendarIcon } from "@heroicons/react/24/solid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import type { Task, Subject } from "../types/app";
import "./HomeworkPage.css";
import { getTasks, addTask, deleteTask, updateTask } from "../services/tasks";
import { getSubjects, addSubject } from "../services/subjects";
import { sendDiscordNotification, DISCORD_COLORS } from "../services/discord";

const HomeworkPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [newTask, setNewTask] = useState({
    title: "",
    dueDate: "",
    type: "Homework",
    subject: "",
    priority: "Medium",
    description: "",
    estimatedTime: "",
    tags: "",
  });

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [formErrors, setFormErrors] = useState<{
    title?: string;
    dueDate?: string;
  }>({});

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksData, subjectsData] = await Promise.all([
        getTasks(),
        getSubjects(),
      ]);
      setTasks(tasksData);

      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire("Error", "Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { title?: string; dueDate?: string } = {};
    if (!newTask.title || newTask.title.trim() === "") {
      errors.title = "กรุณากรอกชื่องาน";
    }
    // Due date is now optional
    // if (!newTask.dueDate) {
    //   errors.dueDate = "กรุณาเลือกวันครบกำหนด";
    // }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const taskData = {
      title: newTask.title,
      dueDate: newTask.dueDate,
      status: "Pending" as const,
      type: newTask.type as "Homework" | "Plan" | "Group Work",
      subject: newTask.subject || "ทั่วไป",
      priority: newTask.priority as "Low" | "Medium" | "High",
      description: newTask.description,
      estimatedTime: newTask.estimatedTime,
      tags: newTask.tags
        ? newTask.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        : [],
      updatedAt: Date.now(),
    };

    setLoading(true);
    try {
      if (editingTaskId) {
        await updateTask(editingTaskId, taskData);
        setTasks(
          tasks.map((t) => (t.id === editingTaskId ? { ...t, ...taskData } : t))
        );
        Swal.fire({
          icon: "success",
          title: "แก้ไขงานสำเร็จ",
          showConfirmButton: false,
          timer: 1500,
        });

        // Notify
        const originalTask = tasks.find((t) => t.id === editingTaskId);

        const getDiffValue = (oldVal: string, newVal: string) => {
          if (oldVal !== newVal) {
            return `\`\`\`diff\n- ${oldVal || "ไม่ระบุ"}\n+ ${newVal || "ไม่ระบุ"}\n\`\`\``;
          }
          return `\`\`\`${newVal || "ไม่ระบุ"}\`\`\``;
        };

        const fields = [
          {
            name: "📌 ชื่องาน",
            value: getDiffValue(originalTask?.title || "", taskData.title),
            inline: false
          },
          {
            name: "📚 วิชา",
            value: getDiffValue(originalTask?.subject || "", taskData.subject),
            inline: false
          },
          {
            name: "🎯 ความสำคัญ",
            value: getDiffValue(originalTask?.priority || "", taskData.priority),
            inline: false
          },
          {
            name: "📅 กำหนดส่ง",
            value: getDiffValue(originalTask?.dueDate || "", taskData.dueDate || ""),
            inline: false
          }
        ];

        if (taskData.description || originalTask?.description) {
          fields.push({
            name: "📝 รายละเอียด",
            value: getDiffValue(originalTask?.description || "", taskData.description),
            inline: false
          });
        }

        await sendDiscordNotification(
          "✏️ แก้ไขงาน",
          `มีการแก้ไขข้อมูลงานโดย${localStorage.getItem("username") || "ที่รัก"}`,
          DISCORD_COLORS.WARNING,
          fields
        );
      } else {
        const addedTask = await addTask(taskData);
        setTasks([...tasks, addedTask]);
        Swal.fire({
          icon: "success",
          title: "เพิ่มงานสำเร็จ",
          showConfirmButton: false,
          timer: 1500,
        });

        // Notify
        const fields = [
          { name: "📌 ชื่องาน", value: `\`\`\`${taskData.title}\`\`\``, inline: false },
          { name: "📚 วิชา", value: `\`\`\`${taskData.subject}\`\`\``, inline: false },
          { name: "🎯 ความสำคัญ", value: `\`\`\`${taskData.priority}\`\`\``, inline: false },
          { name: "📅 กำหนดส่ง", value: `\`\`\`${taskData.dueDate || "ไม่ระบุ"}\`\`\``, inline: false }
        ];

        if (taskData.description) {
          fields.push({ name: "📝 รายละเอียด", value: `\`\`\`${taskData.description}\`\`\``, inline: false });
        }

        await sendDiscordNotification(
          "✨ เพิ่มงานใหม่",
          "ที่รักคะ มีงานมาใหม่จ้า! รีบปั่นนะเดี๋ยวไม่ทัน 🔥",
          DISCORD_COLORS.PRIMARY,
          fields
        );
      }

      setNewTask({
        title: "",
        dueDate: "",
        type: "Homework",
        subject: "",
        priority: "Medium",
        description: "",
        estimatedTime: "",
        tags: "",
      });
      setSelectedDate(null);
      setEditingTaskId(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving task:", error);
      Swal.fire("Error", "Failed to save task", "error");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTask({
      title: task.title,
      dueDate: task.dueDate,
      type: task.type,
      subject: task.subject,
      priority: task.priority,
      description: task.description || "",
      estimatedTime: task.estimatedTime || "",
      tags: task.tags ? (Array.isArray(task.tags) ? task.tags.join(", ") : task.tags) : "",
    });
    setSelectedDate(task.dueDate ? new Date(task.dueDate) : null);
    setIsModalOpen(true);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setNewTask({
      title: "",
      dueDate: "",
      type: "Homework",
      subject: "",
      priority: "Medium",
      description: "",
      estimatedTime: "",
      tags: "",
    });
    setSelectedDate(null);
    setIsModalOpen(false);
  };

  const handleAddSubject = async () => {
    const { value: subjectName } = await Swal.fire({
      title: "เพิ่มวิชาใหม่",
      input: "text",
      inputLabel: "ชื่อวิชา",
      inputPlaceholder: "เช่น ดาราศาสตร์...",
      showCancelButton: true,
      confirmButtonText: "เพิ่ม",
      cancelButtonText: "ยกเลิก",
      inputValidator: (value) => {
        if (!value) {
          return "กรุณากรอกชื่อวิชา!";
        }
      },
    });

    if (subjectName) {
      try {
        const newSubject = await addSubject(subjectName);
        setSubjects([...subjects, newSubject]);
        setNewTask({ ...newTask, subject: subjectName }); // Auto select
        Swal.fire("สำเร็จ", "เพิ่มวิชาเรียนบร้อย", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to add subject", "error");
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "ที่รักค่ะ แน่ใจอ่ะป่าว?",
      text: "การกระทำนี้จะลบงานออกจากระบบ ไม่สามารถย้อนกลับได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ช่ายย, ลบเยย",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
      await Swal.fire({
        title: "ลบแล้ว",
        text: "งานถูกลบเรียบร้อย",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
      });

      // Notify
      const taskToDelete = tasks.find((t) => t.id === id);
      await sendDiscordNotification(
        "🗑️ ลบงาน",
        `งานถูกลบออกจากระบบเรียบร้อยแล้วค่ะที่รัก`,
        DISCORD_COLORS.DANGER,
        [
          { name: "📌 ชื่องาน", value: `\`\`\`${taskToDelete?.title || "ไม่ทราบชื่อ"}\`\`\``, inline: false },
          { name: "📚 วิชา", value: `\`\`\`${taskToDelete?.subject || "ไม่ระบุ"}\`\`\``, inline: false }
        ]
      );
    } catch (error) {
      console.error("Error deleting task:", error);
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถลบงานได้ กรุณาลองอีกครั้ง",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "จะไปแล้วหรอ?",
      text: "ออกจากระบบแล้วจะคิดถึงนะ!",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ไปก็ได้",
      cancelButtonText: "อยู่ต่อ",
      reverseButtons: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
    });

    if (result.isConfirmed) {
      localStorage.removeItem("isAuthenticated");
      navigate("/");
    }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === "Pending" ? "Done" : "Pending";

    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks as Task[]);

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
      await fetchData(); // Revert on error
    }
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High":
        return "🔥";
      case "Medium":
        return "⚡";
      case "Low":
        return "✅";
      default:
        return "📌";
    }
  };

  const motivationalQuotes = [
    "เชื่อมั่นในตัวเอง ทำงานให้ดีที่สุด! 💪",
    "ความสำเร็จเริ่มจากการลงมือทำวันนี้ 🚀",
    "ทุกความพยายามจะไม่สูญเปล่า ⭐",
    "เป้าหมายใกล้แล้ว สู้ต่อไป! 🎯",
    "วันนี้เป็นจุดเริ่มต้นของความสำเร็จ 🌟",
  ];

  const randomQuote =
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "Pending").length,
    done: tasks.filter((t) => t.status === "Done").length,
  };

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-purple-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-pastel-pink">
                📝 จัดการการบ้าน
              </h1>
              <p className="text-sm text-gray-600 mt-1">{randomQuote}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2 bg-pastel-red hover:bg-pastel-red/80 text-white font-semibold rounded-lg transition"
            >
              ออกจากระบบ
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-pastel-blue/10 border-2 border-pastel-blue rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-pastel-blue">
                {stats.total}
              </div>
              <div className="text-sm text-pastel-blue font-medium mt-1">
                งานทั้งหมด
              </div>
            </div>
            <div className="bg-pastel-yellow/10 border-2 border-pastel-yellow rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-pastel-yellow">
                {stats.pending}
              </div>
              <div className="text-sm text-pastel-yellow font-medium mt-1">
                รอดำเนินการ
              </div>
            </div>
            <div className="bg-pastel-green/10 border-2 border-pastel-green rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-pastel-green">
                {stats.done}
              </div>
              <div className="text-sm text-pastel-green font-medium mt-1">
                เสร็จสิ้น
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">


        <Transition appear show={isModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-50"
            onClose={() => {
              if (!loading) cancelEdit();
            }}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all">
                    <form onSubmit={handleAddTask} className="p-6 md:p-8">
                      <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <Dialog.Title
                          as="h3"
                          className="text-2xl font-bold text-gray-800 flex items-center gap-2"
                        >
                          {editingTaskId ? "✏️ แก้ไขงาน" : "✨ เพิ่มงานใหม่"}
                        </Dialog.Title>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-gray-400 hover:text-gray-600 transition"
                        >
                          <span className="sr-only">Close</span>
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📌 ชื่องาน <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            placeholder="พิมพ์ชื่องานที่ต้องทำ..."
                            value={newTask.title}
                            onChange={(e) =>
                              setNewTask({ ...newTask, title: e.target.value })
                            }
                            required
                          />
                          {formErrors.title && (
                            <div className="mt-2 text-sm text-red-600">
                              {formErrors.title}
                            </div>
                          )}
                        </div>

                        {/* Type */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📂 ประเภท <span className="text-red-500">*</span>
                          </label>
                          <Listbox
                            value={newTask.type}
                            onChange={(value) =>
                              setNewTask({ ...newTask, type: value })
                            }
                          >
                            <div className="relative">
                              <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition">
                                <span className="block truncate font-medium">
                                  {newTask.type === "Homework"
                                    ? "📝 การบ้าน"
                                    : newTask.type === "Plan"
                                      ? "📅 แผนงาน"
                                      : "👥 งานกลุ่ม"}
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
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  {["Homework", "Plan", "Group Work"].map(
                                    (type) => (
                                      <Listbox.Option
                                        key={type}
                                        className={({ active }) =>
                                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active
                                            ? "bg-purple-100 text-purple-900"
                                            : "text-gray-900"
                                          }`
                                        }
                                        value={type}
                                      >
                                        {({ selected }) => (
                                          <>
                                            <span
                                              className={`block truncate ${selected
                                                ? "font-bold"
                                                : "font-normal"
                                                }`}
                                            >
                                              {type === "Homework"
                                                ? "📝 การบ้าน"
                                                : type === "Plan"
                                                  ? "📅 แผนงาน"
                                                  : "👥 งานกลุ่ม"}
                                            </span>
                                            {selected && (
                                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
                                                <CheckIcon
                                                  className="h-5 w-5"
                                                  aria-hidden="true"
                                                />
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </Listbox.Option>
                                    )
                                  )}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                        </div>

                        {/* Subject */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📚 วิชา <span className="text-red-500">*</span>
                          </label>
                          <Listbox
                            value={newTask.subject}
                            onChange={(value) =>
                              setNewTask({ ...newTask, subject: value })
                            }
                          >
                            <div className="relative">
                              <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition">
                                <span className="block truncate font-medium">
                                  {newTask.subject || "เลือกวิชา"}
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
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none scrollbar-thin scrollbar-thumb-purple-200">
                                  {subjects.map((subject) => (
                                    <Listbox.Option
                                      key={subject.id}
                                      className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active
                                          ? "bg-purple-100 text-purple-900"
                                          : "text-gray-900"
                                        }`
                                      }
                                      value={subject.name}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${selected
                                              ? "font-bold"
                                              : "font-normal"
                                              }`}
                                          >
                                            {subject.name}
                                          </span>
                                          {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
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
                          <button
                            type="button"
                            onClick={handleAddSubject}
                            className="mt-2 text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                          >
                            <PlusIcon className="h-4 w-4" /> เพิ่มวิชาใหม่
                          </button>
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            🎯 ระดับความสำคัญ <span className="text-red-500">*</span>
                          </label>
                          <Listbox
                            value={newTask.priority}
                            onChange={(value) =>
                              setNewTask({ ...newTask, priority: value })
                            }
                          >
                            <div className="relative">
                              <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition">
                                <span className="block truncate font-medium">
                                  {newTask.priority === "High"
                                    ? "🔥 สูง - ต้องทำด่วน"
                                    : newTask.priority === "Medium"
                                      ? "⚡ ปานกลาง - ทำตามปกติ"
                                      : "✅ ต่ำ - ค่อยทำทีหลัง"}
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
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  {[
                                    {
                                      id: "High",
                                      t: "🔥 สูง - ต้องทำด่วน",
                                      c: "text-red-900",
                                      b: "bg-red-100",
                                      i: "text-red-600",
                                    },
                                    {
                                      id: "Medium",
                                      t: "⚡ ปานกลาง - ทำตามปกติ",
                                      c: "text-yellow-900",
                                      b: "bg-yellow-100",
                                      i: "text-yellow-600",
                                    },
                                    {
                                      id: "Low",
                                      t: "✅ ต่ำ - ค่อยทำทีหลัง",
                                      c: "text-green-900",
                                      b: "bg-green-100",
                                      i: "text-green-600",
                                    },
                                  ].map((p) => (
                                    <Listbox.Option
                                      key={p.id}
                                      className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active
                                          ? p.b + " " + p.c
                                          : "text-gray-900"
                                        }`
                                      }
                                      value={p.id}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${selected
                                              ? "font-bold"
                                              : "font-normal"
                                              }`}
                                          >
                                            {p.t}
                                          </span>
                                          {selected && (
                                            <span
                                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${p.i}`}
                                            >
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                        </div>

                        {/* Due Date */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📅 วันครบกำหนด
                          </label>
                          <div className="relative">
                            <DatePicker
                              selected={selectedDate}
                              onChange={(date: Date | null) => {
                                setSelectedDate(date);
                                if (date) {
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  setNewTask({
                                    ...newTask,
                                    dueDate: `${year}-${month}-${day}`,
                                  });
                                } else {
                                  setNewTask({
                                    ...newTask,
                                    dueDate: "",
                                  });
                                }
                              }}
                              dateFormat="dd/MM/yyyy"
                              placeholderText="ไม่ระบุ/เลือกวันที่"
                              minDate={new Date()}
                              isClearable
                              className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                              calendarClassName="shadow-2xl"
                            />
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 pointer-events-none" />
                            {formErrors.dueDate && (
                              <div className="mt-2 text-sm text-red-600">
                                {formErrors.dueDate}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Estimated Time */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ⏱️ เวลาที่ใช้ (ประมาณ)
                          </label>
                          <Listbox
                            value={newTask.estimatedTime}
                            onChange={(value) =>
                              setNewTask({ ...newTask, estimatedTime: value })
                            }
                          >
                            <div className="relative">
                              <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition">
                                <span className="block truncate font-medium">
                                  {newTask.estimatedTime || "ไม่ระบุ"}
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
                                <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <Listbox.Option
                                    value=""
                                    className={({ active }) =>
                                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active
                                        ? "bg-purple-100 text-purple-900"
                                        : "text-gray-900"
                                      }`
                                    }
                                  >
                                    {({ selected }) => (
                                      <>
                                        <span
                                          className={`block truncate ${selected
                                            ? "font-bold"
                                            : "font-normal"
                                            }`}
                                        >
                                          ไม่ระบุ
                                        </span>
                                        {selected && (
                                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
                                            <CheckIcon
                                              className="h-5 w-5"
                                              aria-hidden="true"
                                            />
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </Listbox.Option>
                                  {[
                                    "15 นาที",
                                    "30 นาที",
                                    "1 ชั่วโมง",
                                    "2 ชั่วโมง",
                                    "3+ ชั่วโมง",
                                  ].map((time) => (
                                    <Listbox.Option
                                      key={time}
                                      value={time}
                                      className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active
                                          ? "bg-purple-100 text-purple-900"
                                          : "text-gray-900"
                                        }`
                                      }
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${selected
                                              ? "font-bold"
                                              : "font-normal"
                                              }`}
                                          >
                                            {time}
                                          </span>
                                          {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                        </div>

                        {/* Tags */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            🏷️ แท็ก (คั่นด้วยจุลภาค)
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            placeholder="เช่น สอบเก็บคะแนน, งานกลุ่ม, สำคัญมาก"
                            value={newTask.tags}
                            onChange={(e) =>
                              setNewTask({ ...newTask, tags: e.target.value })
                            }
                          />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📋 รายละเอียดเพิ่มเติม
                          </label>
                          <textarea
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none"
                            placeholder="เขียนรายละเอียดเพิ่มเติม..."
                            rows={3}
                            value={newTask.description}
                            onChange={(e) =>
                              setNewTask({
                                ...newTask,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>

                        {/* Submit Button */}
                        <div className="md:col-span-2 flex gap-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg py-3 px-6 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading
                              ? "กำลังบันทึก..."
                              : editingTaskId
                                ? "💾 บันทึกการแก้ไข"
                                : "✨ เพิ่มงาน"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={loading}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg py-3 px-6 rounded-xl shadow transition transform hover:scale-105 active:scale-95"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Task List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              📋 รายการงาน ({tasks.length})
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <button
                type="button"
                onClick={() => {
                  setEditingTaskId(null);
                  setNewTask({
                    title: "",
                    dueDate: "",
                    type: "Homework",
                    subject: "",
                    priority: "Medium",
                    description: "",
                    estimatedTime: "",
                    tags: "",
                  });
                  setSelectedDate(null);
                  setIsModalOpen(true);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-pastel-purple hover:bg-pastel-purple/80 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105 active:scale-95"
              >
                <PlusIcon className="h-5 w-5" />
                เพิ่มงานใหม่
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto px-5 py-2.5 bg-pastel-blue hover:bg-pastel-blue/80 text-white font-bold rounded-xl transition transform hover:scale-105 active:scale-95 border-2 border-pastel-blue"
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => navigate("/subjects")}
                className="w-full sm:w-auto px-5 py-2.5 bg-pastel-pink hover:bg-pastel-pink/80 text-white font-bold rounded-xl transition transform hover:scale-105 active:scale-95 border-2 border-pastel-pink"
              >
                📚 จัดการวิชา
              </button>
            </div>
          </div>

          {loading && tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium">กำลังโหลดข้อมูล...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-xl font-medium">ยังไม่มีงาน</p>
              <p className="text-sm mt-2">เพิ่มงานใหม่ด้านบนเพื่อเริ่มต้น!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks
                .sort((a, b) => {
                  if (a.status !== b.status) {
                    return a.status === "Pending" ? -1 : 1;
                  }
                  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
                  return (
                    priorityOrder[a.priority as keyof typeof priorityOrder] -
                    priorityOrder[b.priority as keyof typeof priorityOrder]
                  );
                })
                .map((task) => (
                  <div
                    key={task.id}
                    className={`border-2 rounded-xl p-5 transition-all transform hover:scale-[1.01] hover:shadow-lg ${task.status === "Done"
                      ? "bg-green-50 border-green-300 opacity-75"
                      : "bg-white border-gray-300"
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 w-full">
                        <input
                          type="checkbox"
                          checked={task.status === "Done"}
                          onChange={() => toggleStatus(task)}
                          className="mt-1 w-5 h-5 accent-purple-600 cursor-pointer flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-lg font-bold mb-2 break-words ${task.status === "Done"
                              ? "line-through text-gray-500"
                              : "text-gray-800"
                              }`}
                          >
                            {task.title}
                          </h4>

                          <div className="flex flex-wrap gap-2 mb-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border-2 whitespace-nowrap ${getPriorityColor(
                                task.priority || "Medium"
                              )}`}
                            >
                              {getPriorityIcon(task.priority || "Medium")}{" "}
                              {task.priority || "Medium"}
                            </span>

                            {task.subject && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border-2 border-blue-300 whitespace-nowrap">
                                📚 {task.subject}
                              </span>
                            )}

                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border-2 border-purple-300 whitespace-nowrap">
                              {task.type === "Homework"
                                ? "📝"
                                : task.type === "Plan"
                                  ? "📅"
                                  : "👥"}{" "}
                              {task.type === "Homework"
                                ? "การบ้าน"
                                : task.type === "Plan"
                                  ? "แผนงาน"
                                  : "งานกลุ่ม"}
                            </span>

                            {task.estimatedTime && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold border-2 border-orange-300 whitespace-nowrap">
                                ⏱️ {task.estimatedTime}
                              </span>
                            )}

                            {task.tags && typeof task.tags === 'string' && task.tags.trim() !== '' && (
                              task.tags.split(',').map((tag, index) => (
                                <span key={index} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold border-2 border-teal-300 whitespace-nowrap">
                                  🏷️ {tag.trim()}
                                </span>
                              ))
                            )}
                            {task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
                              task.tags.map((tag, index) => (
                                <span key={index} className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold border-2 border-teal-300 whitespace-nowrap">
                                  🏷️ {tag}
                                </span>
                              ))
                            )}
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold whitespace-nowrap">
                                📅 ครบกำหนด:
                              </span>
                              <span>
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString(
                                    "th-TH",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )
                                  : "ไม่ระบุ"}
                              </span>
                            </div>

                            {task.description && (
                              <div className="flex items-start gap-2">
                                <span className="font-semibold whitespace-nowrap">
                                  📝 รายละเอียด:
                                </span>
                                <span className="text-gray-700 break-words">
                                  {task.description}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="px-4 py-2 bg-pastel-red hover:bg-pastel-red/80 text-white font-semibold rounded-lg transition transform hover:scale-105 active:scale-95 flex-1 sm:flex-none"
                          disabled={loading}
                        >
                          🗑️ ลบ
                        </button>

                        {task.status !== "Done" && (
                          <button
                            onClick={() => startEdit(task)}
                            className="px-4 py-2 bg-pastel-yellow hover:bg-pastel-yellow/80 text-white font-semibold rounded-lg transition transform hover:scale-105 active:scale-95 flex-1 sm:flex-none"
                            disabled={loading}
                          >
                            ✏️ แก้ไข
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeworkPage;
