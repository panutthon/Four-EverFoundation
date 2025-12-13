import { useTheme } from "../hooks/useTheme";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition duration-300 ${theme === "dark"
                    ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                    : "bg-orange-100 text-orange-500 hover:bg-orange-200"
                }`}
            aria-label="Toggle Dark Mode"
        >
            {theme === "dark" ? (
                <MoonIcon className="h-6 w-6" />
            ) : (
                <SunIcon className="h-6 w-6" />
            )}
        </button>
    );
};
