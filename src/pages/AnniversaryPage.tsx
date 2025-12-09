import { useEffect, useState } from "react";
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
  estimatedTime?: string;
}

const AnniversaryPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = "https://sheetdb.io/api/v1/rfau3x5t1i01p";
  const [imageSrc, setImageSrc] = useState<string>("/images/anniversary.jpg");
  const [imageAttempt, setImageAttempt] = useState<number>(0);
  const remoteFallback =
    "https://images.unsplash.com/photo-1505232070786-41e0276baf4a?w=1200&auto=format&fit=crop&q=80";

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const data = await res.json();
      const formatted = data.map((it: any) => ({
        id: it.id,
        title: it.title,
        dueDate: it.dueDate,
        status: it.status,
        type: it.type,
        subject: it.subject || "",
        priority: it.priority || "Medium",
        description: it.description || "",
        estimatedTime: it.estimatedTime || "",
      }));
      setTasks(formatted);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === "Pending" ? "Done" : "Pending";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    try {
      await fetch(`${apiUrl}/id/${encodeURIComponent(task.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { status: newStatus } }),
      });
    } catch (err) {
      console.error("Error updating status:", err);
      fetchTasks();
    }
  };

  const formattedDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center py-12">
      <div className="max-w-3xl w-full px-6">
        <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
          <div className="flex flex-col items-center">
            <img
              src={imageSrc}
              alt="Anniversary"
              onError={() => {
                // try local png, then remote fallback
                if (imageAttempt === 0) {
                  setImageSrc("/images/anniversary.jpg");
                  setImageAttempt(1);
                } else if (imageAttempt === 1) {
                  setImageSrc(remoteFallback);
                  setImageAttempt(2);
                }
              }}
              className="w-40 h-40 object-cover rounded-full shadow-md mb-4"
            />
            <h1 className="text-3xl font-bold text-pink-600 mt-1">
              สุขสันต์ครบรอบ 4 เดือน
            </h1>
          </div>
          <p className="mt-2 text-gray-600">
            ของขวัญ: Four-EverFoundation - To-Do List
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="bg-pink-100/60 rounded-xl p-4">
              <h3 className="font-semibold text-pink-700">คำอวยพร</h3>
              <p className="mt-2 text-sm text-gray-700">
                วันนี้ครบ 4 เดือนของเรา ขอบคุณที่อยู่ข้างๆ กัน 💕
              </p>
            </div>
            <div className="bg-pink-100/60 rounded-xl p-4">
              <h3 className="font-semibold text-pink-700">เล็ก ๆ น้อย ๆ</h3>
              <p className="mt-2 text-sm text-gray-700">
                กดเครื่องหมายเสร็จเมื่องานเรียบร้อยด้วยนะที่รัก
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              To-Do ของเรา
            </h2>

            {loading ? (
              <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มีรายการ
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 12).map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border ${
                      task.status === "Done"
                        ? "bg-green-50 border-green-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {task.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {task.subject ? `${task.subject} • ` : ""}
                          {formattedDate(task.dueDate)}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => toggleStatus(task)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            task.status === "Done"
                              ? "bg-green-500 text-white"
                              : "bg-pink-500 text-white"
                          }`}
                        >
                          {task.status === "Done" ? "เสร็จแล้ว" : "ทำเสร็จ"}
                        </button>
                        <div className="text-xs text-gray-400">
                          {task.priority}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded-full bg-pink-600 text-white font-semibold"
            >
              กลับ
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 rounded-full bg-white border border-pink-600 text-pink-600 font-semibold"
            >
              พิมพ์หน้าเป็นของขวัญ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnniversaryPage;
