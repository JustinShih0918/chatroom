import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./components/homepage";
import { Auth } from "./components/auth";
import { Database } from "./components/database";
import Chatrooms from "./components/Chatrooms";

function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/authentication" element={<Auth />} />
            <Route path="/database" element={<Database />} />
            <Route path="/chatrooms" element={<Chatrooms />} />
        </Routes>
    );
}

export default App;
