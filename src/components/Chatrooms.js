import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config";
import { signOut } from "firebase/auth";

function Chatrooms() {
    const navigate = useNavigate();
    
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Sign out error", error);
        }
    };
    
    return (
        <div>
            <h1>Chatrooms</h1>
            <p>Welcome to your chatrooms! This page will be implemented next.</p>
            <button onClick={handleSignOut}>Sign Out</button>
        </div>
    );
}

export default Chatrooms;