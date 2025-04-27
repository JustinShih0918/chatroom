import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config";
import { signOut } from "firebase/auth";
import { 
    getUserChatrooms, 
    createChatroom, 
    getChatroomMessages, 
    sendMessage, 
    addMemberToChatroom, 
    leaveChatroom,
    getChatroomMembers 
} from "../components/chatroomService";
import "../styles/chatrooms.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

function Chatrooms() {
    // Add state for members
    const [members, setMembers] = useState([]);
    // Rest of your state variables remain the same
    const navigate = useNavigate();
    const [chatrooms, setChatrooms] = useState([]);
    const [activeChatroom, setActiveChatroom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [newChatroomName, setNewChatroomName] = useState("");
    const [newChatroomDescription, setNewChatroomDescription] = useState("");
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [showNewChatroomForm, setShowNewChatroomForm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    
    useEffect(() => {
        // Redirect to home if not logged in
        if (!auth.currentUser) {
            navigate("/");
            return;
        }
        
        const unsubscribe = getUserChatrooms((chatroomsList) => {
            setChatrooms(chatroomsList);
            setLoading(false);
        });
        
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [navigate]);
    
    useEffect(() => {
        let unsubscribe;
        if (activeChatroom) {
            unsubscribe = getChatroomMessages(activeChatroom.id, (messagesList) => {
                setMessages(messagesList);
            });
        }
        
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [activeChatroom]);
    
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Sign out error", error);
        }
    };
    
    const handleCreateChatroom = async (e) => {
        e.preventDefault();
        if (!newChatroomName.trim()) return;
        
        try {
            setError("");
            const chatroomId = await createChatroom(newChatroomName, newChatroomDescription);
            setNewChatroomName("");
            setNewChatroomDescription("");
            setShowNewChatroomForm(false);
        } catch (error) {
            setError("Failed to create chatroom: " + error.message);
        }
    };
    
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatroom) return;
        
        try {
            await sendMessage(activeChatroom.id, newMessage);
            setNewMessage("");
        } catch (error) {
            setError("Failed to send message: " + error.message);
        }
    };
    
    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMemberEmail.trim() || !activeChatroom) return;
        
        try {
            setError("");
            await addMemberToChatroom(activeChatroom.id, newMemberEmail);
            setNewMemberEmail("");
            setError("Member added successfully!");
            setTimeout(() => setError(""), 3000);
        } catch (error) {
            setError("Failed to add member: " + error.message);
        }
    };
    
    const handleLeaveChatroom = async () => {
        if (!activeChatroom) return;
        
        try {
            await leaveChatroom(activeChatroom.id);
            setActiveChatroom(null);
            setShowSettingsPanel(false);
        } catch (error) {
            setError("Failed to leave chatroom: " + error.message);
        }
    };
    
    // Add new useEffect to fetch member data when activeChatroom changes or settings panel opens
    useEffect(() => {
        if (activeChatroom && showSettingsPanel) {
            const fetchMembers = async () => {
                try {
                    const memberData = await getChatroomMembers(activeChatroom.id);
                    setMembers(memberData);
                } catch (error) {
                    console.error("Error fetching members", error);
                    setError("Failed to load members");
                }
            };
            
            fetchMembers();
        }
    }, [activeChatroom, showSettingsPanel]);
    
    // Toggle settings panel function with enhancement to load members
    const toggleSettingsPanel = () => {
        setShowSettingsPanel(!showSettingsPanel);
    };
    
    if (loading) {
        return <div className="loading">Loading chatrooms...</div>;
    }
    
    return (
        <div className="chatrooms-container">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Chatrooms</h2>
                    <button 
                        className="new-chatroom-button"
                        onClick={() => setShowNewChatroomForm(!showNewChatroomForm)}
                    >
                        {showNewChatroomForm ? "Cancel" : "New Chatroom"}
                    </button>
                </div>
                
                {showNewChatroomForm && (
                    <form className="new-chatroom-form" onSubmit={handleCreateChatroom}>
                        <input
                            type="text"
                            placeholder="Chatroom Name"
                            value={newChatroomName}
                            onChange={(e) => setNewChatroomName(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Description (optional)"
                            value={newChatroomDescription}
                            onChange={(e) => setNewChatroomDescription(e.target.value)}
                        />
                        <button type="submit">Create</button>
                    </form>
                )}
                
                <div className="chatroom-list">
                    {chatrooms.length === 0 ? (
                        <p className="no-chatrooms">No chatrooms yet. Create one to get started!</p>
                    ) : (
                        chatrooms.map((chatroom) => (
                            <div 
                                key={chatroom.id} 
                                className={`chatroom-item ${activeChatroom?.id === chatroom.id ? 'active' : ''}`}
                            >
                                <div 
                                    className="chatroom-info"
                                    onClick={() => setActiveChatroom(chatroom)}
                                >
                                    <h3>{chatroom.name}</h3>
                                    <p>{chatroom.description}</p>
                                </div>
                                {activeChatroom?.id === chatroom.id && (
                                    <button 
                                        className="settings-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSettingsPanel();
                                        }}
                                    >
                                        <i className="bi bi-gear-fill"></i>
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
                
                <div className="user-controls">
                    <button onClick={handleSignOut} className="sign-out-button">
                        Sign Out
                    </button>
                </div>
            </div>
            
            <div className="chat-area">
                {activeChatroom ? (
                    <>
                        <div className="chat-header">
                            <div>
                                <h2>{activeChatroom.name}</h2>
                                <p>{activeChatroom.description}</p>
                            </div>
                        </div>
                        
                        <div className="messages-container">
                            {messages.length === 0 ? (
                                <p className="no-messages">No messages yet. Be the first to send a message!</p>
                            ) : (
                                messages.map((message) => (
                                    <div 
                                        key={message.id}
                                        className={`message ${message.userId === auth.currentUser?.uid ? 'own-message' : ''}`}
                                    >
                                        <div className="message-sender">{message.displayName}</div>
                                        <div className="message-content">{message.text}</div>
                                        <div className="message-timestamp">
                                            {message.timestamp ? new Date(message.timestamp).toLocaleString() : 'Sending...'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <form className="message-input-form" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit">Send</button>
                        </form>
                    </>
                ) : (
                    <div className="no-active-chatroom">
                        <h2>Select a chatroom or create a new one</h2>
                        <p>Private chatrooms let you communicate with other members securely</p>
                    </div>
                )}
            </div>
            
            {/* Settings panel that slides in from the right */}
            <div className={`settings-panel ${showSettingsPanel ? 'show' : ''}`}>
                <div className="settings-header">
                    <h3>Chatroom Settings</h3>
                    <button 
                        className="close-settings"
                        onClick={toggleSettingsPanel}
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div className="settings-content">
                    <div className="settings-section">
                        <h4>Add Member</h4>
                        <form className="add-member-form" onSubmit={handleAddMember}>
                            <input
                                type="email"
                                placeholder="Add member by email"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                            />
                            <button type="submit">Add</button>
                        </form>
                    </div>
                    
                    <div className="settings-section">
                        <h4>Members ({members.length})</h4>
                        <div className="members-list">
                            {members.length === 0 ? (
                                <p>Loading members...</p>
                            ) : (
                                <ul className="members-emails-list">
                                    {members.map((member) => (
                                        <li key={member.uid} className="member-item">
                                            <span className="member-email">
                                                <i className="bi bi-person"></i> {member.email}
                                            </span>
                                            {member.uid === activeChatroom?.createdBy && (
                                                <span className="owner-badge">Owner</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    
                    <div className="settings-section danger-zone">
                        <h4>Danger Zone</h4>
                        <button 
                            onClick={handleLeaveChatroom} 
                            className="leave-button"
                        >
                            Leave Chatroom
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Overlay that appears behind the settings panel */}
            {showSettingsPanel && (
                <div 
                    className="settings-overlay"
                    onClick={toggleSettingsPanel}
                ></div>
            )}
            
            {error && (
                <div className={`notification ${error.includes("Failed") ? "error" : "success"}`}>
                    {error}
                    <button onClick={() => setError("")}>&times;</button>
                </div>
            )}
        </div>
    );
}

export default Chatrooms;