import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect
} from "firebase/auth";
import { auth } from "../config";
import "../styles/homepage.css";

function HomePage() {
    const [activeTab, setActiveTab] = useState("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/chatrooms");
        } catch (error) {
            setError("Failed to sign in: " + error.message);
        }
        
        setLoading(false);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");
        
        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }
        
        setLoading(true);
        
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate("/chatrooms");
        } catch (error) {
            setError("Failed to create account: " + error.message);
        }
        
        setLoading(false);
    };

    // Add Google Sign-In functions from auth.js
    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);
        const provider = new GoogleAuthProvider();
        
        try {
            await signInWithPopup(auth, provider);
            navigate("/chatrooms");
        } catch (error) {
            setError("Google sign-in failed: " + error.message);
        }
        
        setLoading(false);
    };

    return (
        <div className="home-container">
            <div className="home-content">
                <div className="home-header">
                    <h1>Firebase Chatroom</h1>
                    <p className="tagline">Connect and chat securely with your friends</p>
                </div>
                
                <div className="auth-container">
                    <div className="auth-tabs">
                        <button 
                            className={`tab-button ${activeTab === "signin" ? "active" : ""}`}
                            onClick={() => setActiveTab("signin")}
                        >
                            Sign In
                        </button>
                        <button 
                            className={`tab-button ${activeTab === "signup" ? "active" : ""}`}
                            onClick={() => setActiveTab("signup")}
                        >
                            Sign Up
                        </button>
                    </div>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    {activeTab === "signin" ? (
                        <>
                            <form className="auth-form" onSubmit={handleSignIn}>
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="auth-button"
                                    disabled={loading}
                                >
                                    {loading ? "Signing in..." : "Sign In"}
                                </button>
                            </form>
                            
                            <div className="divider">
                                <span>OR</span>
                            </div>
                            
                            <button 
                                className="google-button" 
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                            >
                                <img 
                                    src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
                                    alt="Google"
                                    className="google-icon"
                                />
                                Sign in with Google
                            </button>
                        </>
                    ) : (
                        <form className="auth-form" onSubmit={handleSignUp}>
                            <div className="form-group">
                                <label htmlFor="signup-email">Email</label>
                                <input
                                    type="email"
                                    id="signup-email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="signup-password">Password</label>
                                <input
                                    type="password"
                                    id="signup-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm-password">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirm-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="auth-button"
                                disabled={loading}
                            >
                                {loading ? "Creating account..." : "Sign Up"}
                            </button>
                        </form>
                    )}
                </div>
                
                <div className="additional-links">
                    <Link to="/database" className="link-button">Database Demo</Link>
                    <Link to="/authentication" className="link-button">Authentication Demo</Link>
                </div>
            </div>
        </div>
    );
}

export default HomePage;