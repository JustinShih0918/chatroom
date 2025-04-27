import { Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import Chatrooms from "./components/Chatrooms";
import UserProfile from "./components/UserProfile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/chatrooms" element={<Chatrooms />} />
      <Route path="/profile" element={<UserProfile />} />
    </Routes>
  );
}

export default App;
