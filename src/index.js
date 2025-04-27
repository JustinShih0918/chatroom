import React from "react";
import ReactDOM from "react-dom/client";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import App from "./App";
import { Auth } from "./components/auth";
import { Database } from "./components/database";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    // <React.StrictMode>
    <Router>
        <Routes>
            <Route path="*" element={<App />}></Route>
            <Route path="/authentication" element={<Auth />}></Route>
            <Route path="/database" element={<Database />}></Route>
        </Routes>
    </Router>
    // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
