import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { ref, set, serverTimestamp, get, update } from "firebase/database";
import { auth, db } from "../config";
import "../styles/HomePage.css";
// Import Bootstrap icons
import 'bootstrap-icons/font/bootstrap-icons.css';

function HomePage() {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const mode = params.get("mode");
        if (mode === "signup") setActiveTab("signup");
        else setActiveTab("signin");
    }, [location.search]);

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

    // Update how users are created during sign up
    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");
        
        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }
        
        setLoading(true);
        
        try {
            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Store user data in the database with additional fields
            await set(ref(db, `users/${user.uid}`), {
                email: user.email,
                displayName: user.email.split('@')[0],
                photoURL: null,
                age: null,
                gender: "",
                phoneNumber: "",
                address: "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            navigate("/chatrooms");
        } catch (error) {
            setError("Failed to create account: " + error.message);
        }
        
        setLoading(false);
    };

    // Also update Google sign-in to include the same fields
    const handleGoogleSignIn = async () => {
        setError("");
        setLoading(true);
        const provider = new GoogleAuthProvider();
        
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Get existing user data if any
            const userRef = ref(db, `users/${user.uid}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                // Update login timestamp if user exists
                await update(userRef, {
                    lastLogin: serverTimestamp(),
                    // Ensure email is updated in case it changed in Google account
                    email: user.email
                });
            } else {
                // Store new user data
                await set(userRef, {
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    photoURL: user.photoURL,
                    age: null,
                    gender: "",
                    phoneNumber: "",
                    address: "",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
            
            navigate("/chatrooms");
        } catch (error) {
            setError("Google sign-in failed: " + error.message);
        }
        
        setLoading(false);
    };

    return (
        <div className="home-container">
            <div className="blob-bg"></div>
            <div className="home-content">
                <div className="home-header">
                    <h1>ChatVerse</h1>
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
                                {/* Replace the img with Bootstrap icon */}
                                <i className="bi bi-google google-icon"></i>
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
            </div>
        </div>
    );
}

export default HomePage;