import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import type { Subject } from "../types/app";
import {
  getSubjects,
  addSubject,
  updateSubject,
  deleteSubject,
} from "../services/subjects";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

const SubjectPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

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
      const data = await getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      Swal.fire("Error", "Failed to load subjects", "error");
    } finally {
      setLoading(false);
    }
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
      setLoading(true);
      try {
        const newSubject = await addSubject(subjectName);
        setSubjects([...subjects, newSubject]);
        Swal.fire("สำเร็จ", "เพิ่มวิชาเรียบร้อย", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to add subject", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditSubject = async (subject: Subject) => {
    const { value: newName } = await Swal.fire({
      title: "แก้ไขชื่อวิชา",
      input: "text",
      inputLabel: "ชื่อวิชา",
      inputValue: subject.name,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      inputValidator: (value) => {
        if (!value) {
          return "กรุณากรอกชื่อวิชา!";
        }
      },
    });

    if (newName && newName !== subject.name) {
      setLoading(true);
      try {
        await updateSubject(subject.id, { name: newName });
        setSubjects(
          subjects.map((s) =>
            s.id === subject.id ? { ...s, name: newName } : s
          )
        );
        Swal.fire("สำเร็จ", "แก้ไขชื่อวิชาเรียบร้อย", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to update subject", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const result = await Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "การกระทำนี้จะลบวิชานี้ออกจากระบบ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบเลย",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await deleteSubject(id);
      setSubjects(subjects.filter((s) => s.id !== id));
      Swal.fire("ลบแล้ว", "ลบวิชาเรียบร้อย", "success");
    } catch (err) {
      Swal.fire("Error", "Failed to delete subject", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-purple-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-purple-600">
                📚 จัดการรายวิชา
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                เพิ่ม ลบ แก้ไข รายวิชาทั้งหมด
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/homework")}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              รายชื่อวิชา ({subjects.length})
            </h2>
            <button
              onClick={handleAddSubject}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" /> เพิ่มวิชา
            </button>
          </div>

          {loading && subjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="bg-purple-50 border-2 border-purple-100 rounded-xl p-4 flex justify-between items-center hover:border-purple-300 transition"
                >
                  <span className="font-semibold text-lg text-gray-800">
                    {subject.name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSubject(subject)}
                      className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition"
                      title="แก้ไข"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      title="ลบ"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && subjects.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-xl font-medium">ยังไม่มีวิชาเรียน</p>
              <p className="text-sm mt-2">กดปุ่มเพิ่มวิชาด้านบนได้เลย</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectPage;
