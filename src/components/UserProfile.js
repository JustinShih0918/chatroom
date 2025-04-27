import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import { auth, db } from "../config";
import "../styles/userprofile.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

// Import profile pictures
import profile1 from "../media/profile/profile1.png";
import profile2 from "../media/profile/profile2.png";
import profile3 from "../media/profile/profile3.png";
import profile4 from "../media/profile/profile4.png";
import profile5 from "../media/profile/profile5.png";
import profile6 from "../media/profile/profile6.png";

// Define available profile pictures
const profilePictures = [
    { id: 'profile1', src: profile1, alt: 'Profile 1' },
    { id: 'profile2', src: profile2, alt: 'Profile 2' },
    { id: 'profile3', src: profile3, alt: 'Profile 3' },
    { id: 'profile4', src: profile4, alt: 'Profile 4' },
    { id: 'profile5', src: profile5, alt: 'Profile 5' },
    { id: 'profile6', src: profile6, alt: 'Profile 6' },
];

function UserProfile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        displayName: "",
        photoURL: "",
        age: "",
        gender: ""
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedPicture, setSelectedPicture] = useState(null);
    const [showPictureSelection, setShowPictureSelection] = useState(false);
    
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
                        gender: data.gender || ""
                    });
                    
                    // Set the selected picture if the user already has one
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
        setSelectedPicture(pictureUrl);
        setUserData({
            ...userData,
            photoURL: pictureUrl
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
            
            // Validate age if provided
            let ageValue = null;
            if (userData.age) {
                ageValue = parseInt(userData.age);
                if (isNaN(ageValue) || ageValue < 13 || ageValue > 120) {
                    throw new Error("Age must be between 13 and 120");
                }
            }
            
            // Update user profile
            await update(ref(db, `users/${user.uid}`), {
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                age: ageValue,
                gender: userData.gender,
                updatedAt: new Date().toISOString()
            });
            
            setSuccess("Profile updated successfully!");
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
                    <label htmlFor="age">Age (optional)</label>
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
                
                <div className="form-group">
                    <label htmlFor="gender">Gender (optional)</label>
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