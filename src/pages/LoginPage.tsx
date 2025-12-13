import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username === "gam" && password === "gamaom") {
      localStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
    } else {
      setError("รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen bg-pastel-blue/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pastel-blue mb-2">
            📚 Homework Gam
          </h1>
          <p className="text-gray-500">เข้าสู่ระบบเพื่อจัดการ การบ้านแฟน</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pastel-pink focus:border-transparent outline-none transition"
              placeholder="กรอกชื่อผู้ใช้"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              รหัสผ่าน
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pastel-pink focus:border-transparent outline-none transition"
              placeholder="กรอกรหัสผ่าน"
              required
            />
          </div>

          {error && (
            <div className="bg-pastel-red/20 border border-pastel-red text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-pastel-blue hover:bg-pastel-blue/80 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105 active:scale-95"
          >
            เข้าสู่ระบบแบร่ๆ
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>ณัฏฐธิรดา & ปณัฐฑรณ์</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
