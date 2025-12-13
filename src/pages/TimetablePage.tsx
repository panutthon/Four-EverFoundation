import { useState, useEffect, Fragment } from "react";
import { Transition, Dialog, Listbox } from "@headlessui/react";
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ChevronUpDownIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import type { ClassSchedule, Subject } from "../types/app";
import { Navbar } from "../components/Navbar";
import {
    getSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
} from "../services/timetable";
import { getSubjects } from "../services/subjects";

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
] as const;

const DAY_MAP: Record<string, string> = {
    Monday: "วันจันทร์",
    Tuesday: "วันอังคาร",
    Wednesday: "วันพุธ",
    Thursday: "วันพฤหัสบดี",
    Friday: "วันศุกร์",
    Saturday: "วันเสาร์",
    Sunday: "วันอาทิตย์",
};

const TimetablePage = () => {
    const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState<Omit<ClassSchedule, "id">>({
        day: "Monday",
        startTime: "",
        endTime: "",
        subject: "",
        room: "",
        note: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [scheds, subjs] = await Promise.all([getSchedules(), getSubjects()]);
            setSchedules(scheds);
            setSubjects(subjs);
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to load timetable", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await updateSchedule(editingId, form);
                setSchedules((prev) =>
                    prev.map((s) => (s.id === editingId ? { ...form, id: editingId } : s))
                );
                Swal.fire("สำเร็จ", "แก้ไขตารางเรียนเรียบร้อย", "success");
            } else {
                const newSched = await addSchedule(form);
                setSchedules((prev) => [...prev, newSched]);
                Swal.fire("สำเร็จ", "เพิ่มตารางเรียนเรียบร้อย", "success");
            }
            closeModal();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to save schedule", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: "แน่ใจนะ?",
            text: "ลบแล้วต้องเพิ่มใหม่นะ!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ลบเลย",
            cancelButtonText: "ยกเลิก",
            confirmButtonColor: "#EF4444",
            reverseButtons: true,
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await deleteSchedule(id);
                setSchedules((prev) => prev.filter((s) => s.id !== id));
                Swal.fire("ลบแล้ว", "ลบตารางเรียนเรียบร้อย", "success");
            } catch (error) {
                console.error(error);
                Swal.fire("Error", "Failed to delete", "error");
            } finally {
                setLoading(false);
            }
        }
    };

    const openModal = (schedule?: ClassSchedule) => {
        if (schedule) {
            setEditingId(schedule.id);
            setForm({
                day: schedule.day,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                subject: schedule.subject,
                room: schedule.room || "",
                note: schedule.note || "",
            });
        } else {
            setEditingId(null);
            setForm({
                day: "Monday",
                startTime: "",
                endTime: "",
                subject: "",
                room: "",
                note: "",
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const groupedSchedules = DAYS.map((day) => ({
        day,
        schedules: schedules
            .filter((s) => s.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));

    return (
        <div className="min-h-screen bg-indigo-50 dark:bg-gray-900 transition-colors duration-300">
            <Navbar
                title="📅 ตารางเรียน"
                quote="วางแผนการเรียนให้เป๊ะปัง!"
                borderColor="border-pastel-blue"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-pastel-purple hover:bg-pastel-purple/80 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-105"
                    >
                        <PlusIcon className="h-6 w-6" />
                        เพิ่มตารางเรียน
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupedSchedules.map(({ day, schedules }) => (
                        <div
                            key={day}
                            className={`rounded-2xl shadow-lg overflow-hidden bg-white dark:bg-gray-800 transition-colors duration-300 border-t-8 ${day === "Monday"
                                ? "border-pastel-yellow"
                                : day === "Tuesday"
                                    ? "border-pastel-pink"
                                    : day === "Wednesday"
                                        ? "border-pastel-green"
                                        : day === "Thursday"
                                            ? "border-orange-300"
                                            : day === "Friday"
                                                ? "border-pastel-blue"
                                                : day === "Saturday"
                                                    ? "border-pastel-purple"
                                                    : "border-pastel-red"
                                }`}
                        >
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {DAY_MAP[day]}
                                </h3>
                            </div>
                            <div className="p-4 space-y-4">
                                {schedules.length === 0 ? (
                                    <p className="text-center text-gray-400 dark:text-gray-500 py-4">
                                        ไม่มีเรียน
                                    </p>
                                ) : (
                                    schedules.map((schedule) => (
                                        <div
                                            key={schedule.id}
                                            className="group relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:shadow-md transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-sm font-bold text-pastel-blue bg-pastel-blue/10 px-2 py-1 rounded-lg">
                                                    {schedule.startTime} - {schedule.endTime}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openModal(schedule)}
                                                        className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-lg dark:hover:bg-yellow-900/20"
                                                    >
                                                        <PencilSquareIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(schedule.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-gray-800 dark:text-white mb-1">
                                                {schedule.subject}
                                            </h4>
                                            {schedule.room && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                                    📍 {schedule.room}
                                                </p>
                                            )}
                                            {schedule.note && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                                                    📝 {schedule.note}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={closeModal}
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
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-bold leading-6 text-gray-900 dark:text-white mb-6"
                                    >
                                        {editingId ? "✏️ แก้ไขตารางเรียน" : "✨ เพิ่มตารางเรียน"}
                                    </Dialog.Title>
                                    <form onSubmit={handleSave} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                วัน
                                            </label>
                                            <Listbox
                                                value={form.day}
                                                onChange={(value) =>
                                                    setForm({ ...form, day: value as any })
                                                }
                                            >
                                                <div className="relative">
                                                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-700 py-2 pl-4 pr-10 text-left border dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pastel-purple transition">
                                                        <span className="block truncate font-medium text-gray-900 dark:text-white">
                                                            {DAY_MAP[form.day]}
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
                                                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                            {DAYS.map((day) => (
                                                                <Listbox.Option
                                                                    key={day}
                                                                    className={({ active }) =>
                                                                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active
                                                                            ? "bg-purple-100 text-purple-900"
                                                                            : "text-gray-900 dark:text-gray-100"
                                                                        }`
                                                                    }
                                                                    value={day}
                                                                >
                                                                    {({ selected }) => (
                                                                        <>
                                                                            <span
                                                                                className={`block truncate ${selected
                                                                                    ? "font-bold"
                                                                                    : "font-normal"
                                                                                    }`}
                                                                            >
                                                                                {DAY_MAP[day]}
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
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    เวลาเริ่ม
                                                </label>
                                                <input
                                                    type="time"
                                                    value={form.startTime}
                                                    onChange={(e) =>
                                                        setForm({ ...form, startTime: e.target.value })
                                                    }
                                                    required
                                                    className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pastel-purple"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    เวลาสิ้นสุด
                                                </label>
                                                <input
                                                    type="time"
                                                    value={form.endTime}
                                                    onChange={(e) =>
                                                        setForm({ ...form, endTime: e.target.value })
                                                    }
                                                    required
                                                    className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pastel-purple"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                วิชา
                                            </label>
                                            <Listbox
                                                value={form.subject}
                                                onChange={(value) =>
                                                    setForm({ ...form, subject: value })
                                                }
                                            >
                                                <div className="relative">
                                                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-700 py-2 pl-4 pr-10 text-left border dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-pastel-purple transition">
                                                        <span className="block truncate font-medium text-gray-900 dark:text-white">
                                                            {form.subject || "เลือกวิชา"}
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
                                                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none scrollbar-thin scrollbar-thumb-purple-200">
                                                            {subjects.map((subject) => (
                                                                <Listbox.Option
                                                                    key={subject.id}
                                                                    className={({ active }) =>
                                                                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active
                                                                            ? "bg-purple-100 text-purple-900"
                                                                            : "text-gray-900 dark:text-gray-100"
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
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                ห้องเรียน (ไม่บังคับ)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.room}
                                                onChange={(e) =>
                                                    setForm({ ...form, room: e.target.value })
                                                }
                                                placeholder="เช่น ห้อง 401"
                                                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pastel-purple"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                โน้ตช่วยจำ (ไม่บังคับ)
                                            </label>
                                            <input
                                                type="text"
                                                value={form.note}
                                                onChange={(e) =>
                                                    setForm({ ...form, note: e.target.value })
                                                }
                                                placeholder="เช่น เอาหนังสือเล่มเขียวมาด้วย"
                                                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pastel-purple"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-4 py-2 bg-pastel-purple hover:bg-pastel-purple/80 text-white font-bold rounded-lg transition shadow-lg"
                                            >
                                                {loading ? "บันทึก..." : "บันทึก"}
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default TimetablePage;
