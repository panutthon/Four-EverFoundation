import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import Swal from "sweetalert2";

interface NavbarProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    quote?: React.ReactNode;
    borderColor?: string;
}

export const Navbar = ({
    title,
    subtitle,
    quote,
    borderColor = "border-pastel-pink"
}: NavbarProps) => {
    const navigate = useNavigate();
    const location = useLocation();

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

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className={`bg-white dark:bg-gray-800 shadow-md border-b-4 ${borderColor} transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-center py-6 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-pastel-blue">
                            {title}
                        </h1>
                        {subtitle && <p className="text-gray-700 dark:text-gray-200 mt-1 font-medium">{subtitle}</p>}
                        {quote && <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{quote}</p>}
                    </div>
                    <div className="flex gap-3 flex-wrap justify-center">
                        <ThemeToggle />

                        {!isActive("/dashboard") && (
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="px-6 py-2.5 bg-pastel-blue hover:bg-pastel-blue/80 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
                            >
                                📊 Dashboard
                            </button>
                        )}

                        {!isActive("/timetable") && (
                            <button
                                onClick={() => navigate("/timetable")}
                                className="px-6 py-2.5 bg-pastel-purple hover:bg-pastel-purple/80 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105"
                            >
                                📅 ตารางเรียน
                            </button>
                        )}

                        {!isActive("/homework") && (
                            <button
                                onClick={() => navigate("/homework")}
                                className="px-6 py-2.5 bg-pastel-pink hover:bg-pastel-pink/80 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105 text-nowrap"
                            >
                                📝 จัดการงาน
                            </button>
                        )}

                        <button
                            onClick={handleLogout}
                            className="px-6 py-2.5 bg-pastel-red hover:bg-pastel-red/80 text-white font-semibold rounded-xl shadow-lg transition transform hover:scale-105 text-nowrap"
                        >
                            ออกจากระบบ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
