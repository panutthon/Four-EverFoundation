import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./global.css";

import LoginPage from "./pages/LoginPage";
import HomeworkPage from "./pages/HomeworkPage";
import DashboardPage from "./pages/DashboardPage";
import AnniversaryPage from "./pages/AnniversaryPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/homework" element={<HomeworkPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/anniversary" element={<AnniversaryPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
