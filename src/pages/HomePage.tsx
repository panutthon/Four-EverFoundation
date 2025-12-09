import { Link } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  return (
    <div className="home-container">
      <h1>Aom's Dashboard</h1>
      <nav className="nav-menu">
        <Link to="/homework" className="nav-link">
          📝 Homework & Planner
        </Link>
      </nav>
    </div>
  );
};

export default HomePage;
