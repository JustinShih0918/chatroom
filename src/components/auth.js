import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    signOut
} from "firebase/auth";
import { useState } from "react";
import { auth } from "../config";

export const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignUp = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("sign up successfully");
        } catch (e) {
            console.error(e);
        }
        setEmail("");
        setPassword("");
    };

    const handleSignIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("sign in successfully");
        } catch (e) {
            console.error(e);
        }
        setEmail("");
        setPassword("");
    };

    const handleGooglePopUp = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            console.log("sign in successfully");
        } catch (e) {
            console.error(e);
        }
    };

    const handleGoogleRedirect = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithRedirect(auth, provider);
            console.log("sign in successfully");
        } catch (e) {
            console.error(e);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            console.log("sign out successfully");
        } catch (e) {
            console.error(e);
        }
    };

    onAuthStateChanged(auth, (user) => {
        var usrDiv = document.getElementById("usrDiv");
        var usrName = document.getElementById("usrName");
        var useEmail = document.getElementById("useEmail");
        if (user) {
            usrDiv.style.visibility = "visible";
            usrName.innerHTML = "User Name: " + user.displayName;
            useEmail.innerHTML = "User Email: " + user.email;
        } else {
            usrDiv.style.visibility = "hidden";
        }
    });

    return (
        <>
            <h1>Firebase Authentication</h1>
            <div>
                <h2>Email/Password</h2>
                <input
                    type="email"
                    placeholder="Email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                ></input>
                <input
                    type="password"
                    placeholder="Password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                ></input>
                <button onClick={handleSignIn}>Sign In</button>
                <button onClick={handleSignUp}>Sign Up</button>
            </div>
            <div>
                <h2>Google</h2>
                <button onClick={handleGooglePopUp}>Log in with Pop-up</button>
                <button onClick={handleGoogleRedirect}>
                    Log in with Redirect
                </button>
            </div>
            <div id="usrDiv">
                <h2>User</h2>
                <p id="usrName"></p>
                <p id="useEmail"></p>
                <button onClick={handleSignOut}>Sign Out</button>
            </div>
        </>
    );
};
