import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/openingpage.css";

function OpeningPage() {
  const navigate = useNavigate();

  return (
    <div className="opening-bg">
      <div className="opening-animation">
        <h1 className="opening-title">Welcome to ChatVerse</h1>
        <p className="opening-desc">Connect. Share. Enjoy.</p>
        <div className="opening-btn-group">
          <button className="opening-btn" onClick={() => navigate("/home?mode=signin")}>
            Sign In
          </button>
          <button className="opening-btn outline" onClick={() => navigate("/home?mode=signup")}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default OpeningPage;