import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import { updateEmail, updateProfile } from "firebase/auth";
import { auth, db } from "../config";
import "../styles/userprofile.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

const profilePictures = [
    { 
        id: 'profile1', 
        src: '/media/profile/profile1.png', 
        alt: 'Profile 1' 
    },
    { 
        id: 'profile2', 
        src: '/media/profile/profile2.png', 
        alt: 'Profile 2' 
    },
    { 
        id: 'profile3', 
        src: '/media/profile/profile3.png', 
        alt: 'Profile 3' 
    },
    { 
        id: 'profile4', 
        src: '/media/profile/profile4.png', 
        alt: 'Profile 4' 
    },
    { 
        id: 'profile5', 
        src: '/media/profile/profile5.png', 
        alt: 'Profile 5' 
    },
    { 
        id: 'profile6', 
        src: '/media/profile/profile6.png', 
        alt: 'Profile 6' 
    },
];

function UserProfile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        displayName: "",
        photoURL: "",
        age: "",
        gender: "",
        email: "",
        phoneNumber: "",
        address: ""
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedPicture, setSelectedPicture] = useState(null);
    const [showPictureSelection, setShowPictureSelection] = useState(false);
    const [originalEmail, setOriginalEmail] = useState("");
    
    useEffect(() => {
        const fetchUserData = async () => {
            if (!auth.currentUser) {
                navigate("/");
                return;
            }
            
            try {
                const userRef = ref(db, `users/${auth.currentUser.uid}`);
                const snapshot = await get(userRef);
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setUserData({
                        displayName: data.displayName || "",
                        photoURL: data.photoURL || "",
                        age: data.age || "",
                        gender: data.gender || "",
                        email: auth.currentUser.email || data.email || "",
                        phoneNumber: data.phoneNumber || "",
                        address: data.address || ""
                    });
                    
                    setOriginalEmail(auth.currentUser.email || "");
                    
                    if (data.photoURL) {
                        setSelectedPicture(data.photoURL);
                    }
                }
                
                setLoading(false);
            } catch (error) {
                setError("Failed to load profile data");
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, [navigate]);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData({
            ...userData,
            [name]: value
        });
    };
    
    const handlePictureSelect = (pictureUrl) => {
        const fullUrl = new URL(pictureUrl, window.location.origin).toString();
        
        setSelectedPicture(fullUrl);
        setUserData({
            ...userData,
            photoURL: fullUrl
        });
        setShowPictureSelection(false);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setUpdating(true);
        
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("User not authenticated");
            
            let ageValue = null;
            if (userData.age) {
                ageValue = parseInt(userData.age);
                if (isNaN(ageValue) || ageValue < 13 || ageValue > 120) {
                    throw new Error("Age must be between 13 and 120");
                }
            }
            
            // Validate phone number
            if (userData.phoneNumber && !/^[0-9+\-\s()]{7,20}$/.test(userData.phoneNumber)) {
                throw new Error("Phone number should only contain numbers, spaces, hyphens, parentheses, and plus signs");
            }
            
            if (userData.email !== originalEmail) {
                try {
                    await updateEmail(user, userData.email);
                } catch (error) {
                    if (error.code === 'auth/requires-recent-login') {
                        throw new Error("Email change requires recent login. Please sign out and sign in again before changing your email.");
                    } else {
                        throw new Error("Failed to update email: " + error.message);
                    }
                }
            }
            
            await updateProfile(user, {
                displayName: userData.displayName,
                photoURL: userData.photoURL
            });
            
            await update(ref(db, `users/${user.uid}`), {
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                age: ageValue,
                gender: userData.gender,
                email: userData.email,
                phoneNumber: userData.phoneNumber,
                address: userData.address,
                updatedAt: new Date().toISOString()
            });
            
            setSuccess("Profile updated successfully!");
            setOriginalEmail(userData.email); 
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            setError("Failed to update profile: " + error.message);
        }
        
        setUpdating(false);
    };
    
    const goBack = () => {
        navigate("/chatrooms");
    };
    
    if (loading) {
        return <div className="loading">Loading profile...</div>;
    }
    
    return (
        <div className="profile-container">
            <div className="profile-header">
                <button className="back-button" onClick={goBack}>
                    <i className="bi bi-arrow-left"></i> Back to Chatrooms
                </button>
                <h1>Edit Profile</h1>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form className="profile-form" onSubmit={handleSubmit}>
                <div className="profile-image-section">
                    <div className="profile-image-container">
                        {selectedPicture ? (
                            <img 
                                src={selectedPicture} 
                                alt="Profile" 
                                className="profile-image" 
                            />
                        ) : (
                            <div className="profile-image-placeholder">
                                <i className="bi bi-person"></i>
                            </div>
                        )}
                    </div>
                    <button 
                        type="button" 
                        className="image-selection-button"
                        onClick={() => setShowPictureSelection(!showPictureSelection)}
                    >
                        <i className="bi bi-grid"></i> Choose Profile Picture
                    </button>
                    
                    {showPictureSelection && (
                        <div className="profile-pictures-grid">
                            {profilePictures.map((pic) => (
                                <div 
                                    key={pic.id}
                                    className={`profile-picture-option ${selectedPicture === pic.src ? 'selected' : ''}`}
                                    onClick={() => handlePictureSelect(pic.src)}
                                >
                                    <img src={pic.src} alt={pic.alt} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="profile-details">
                    <div className="form-group">
                        <label htmlFor="displayName">Display Name</label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={userData.displayName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={userData.email}
                            onChange={handleInputChange}
                            required
                        />
                        <small className="form-hint">Changing email requires recent login</small>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={userData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="e.g., 0907-191-676"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <textarea
                            id="address"
                            name="address"
                            value={userData.address}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Your address"
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group half-width">
                            <label htmlFor="age">Age</label>
                            <input
                                type="number"
                                id="age"
                                name="age"
                                value={userData.age}
                                onChange={handleInputChange}
                                min="13"
                                max="120"
                            />
                        </div>
                        
                        <div className="form-group half-width">
                            <label htmlFor="gender">Gender</label>
                            <select
                                id="gender"
                                name="gender"
                                value={userData.gender}
                                onChange={handleInputChange}
                            >
                                <option value="">Prefer not to say</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    className="save-button"
                    disabled={updating}
                >
                    {updating ? "Saving..." : "Save Profile"}
                </button>
            </form>
        </div>
    );
}

export default UserProfile;