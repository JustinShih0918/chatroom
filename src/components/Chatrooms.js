import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../config";
import { signOut } from "firebase/auth";
import { 
    getUserChatrooms, 
    createChatroom, 
    getChatroomMessages, 
    sendMessage, 
    addMemberToChatroom, 
    leaveChatroom,
    searchUsers,
    listenToChatroomMembers,
    unsendMessage,
} from "../components/chatroomService";
import { 
  initializeNotifications, 
  setupMessageNotifications 
} from '../components/notificationManager';
import "../styles/chatrooms.css";
import "../styles/messages.css";
import "../styles/settings.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

function Chatrooms() {
    // All state hooks first (you already have these at the top)
    const [members, setMembers] = useState([]);
    const navigate = useNavigate();
    const [chatrooms, setChatrooms] = useState([]);
    const [activeChatroom, setActiveChatroom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [newChatroomName, setNewChatroomName] = useState("");
    const [newChatroomDescription, setNewChatroomDescription] = useState("");
    const [showNewChatroomForm, setShowNewChatroomForm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const messagesEndRef = React.useRef(null);
    const contextMenuRef = React.useRef(null);

    // Move context menu states here - before any conditional returns
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [longPressTimer, setLongPressTimer] = useState(null);
    
    // Remove unused state
    // const [newMemberEmail, setNewMemberEmail] = useState("");

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Add this effect to properly handle authentication state
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                // Only navigate to home if we've confirmed the user is not signed in
                navigate("/");
            }
        });
        
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        // Only fetch chatrooms if user is authenticated
        if (user) {
            const unsubscribe = getUserChatrooms((chatroomsList) => {
                setChatrooms(chatroomsList);
                setLoading(false);
            });
            
            return () => {
                if (unsubscribe) unsubscribe();
            };
        }
    }, [user]); // Changed dependency from navigate to user
    
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

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    // Fetch members when active chatroom changes or settings panel opens
    useEffect(() => {
        let unsubscribe = null;
        
        if (activeChatroom && showSettingsPanel) {
            unsubscribe = listenToChatroomMembers(activeChatroom.id, (memberData) => {
                setMembers(memberData);
            });
        }
        
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [activeChatroom, showSettingsPanel]);
    
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
            await createChatroom(newChatroomName, newChatroomDescription); // Remove variable assignment
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
    
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const handleSearch = async (term) => {
        setSearchTerm(term);
        
        if (term.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        
        setIsSearching(true);
        try {
            const results = await searchUsers(term);
            
            // Filter out users who are already members
            if (activeChatroom && members.length > 0) {
                const filteredResults = results.filter(user => 
                    !members.some(member => member.uid === user.uid)
                );
                setSearchResults(filteredResults);
            } else {
                setSearchResults(results);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleSelectUser = async (user) => {
        try {
            setError("");
            await addMemberToChatroom(activeChatroom.id, user.email);
            setSearchTerm("");
            setSearchResults([]);
            setError("Member added successfully!");
            setTimeout(() => setError(""), 3000);
        } catch (error) {
            setError("Failed to add member: " + error.message);
        }
    };
    
    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim() || !activeChatroom) return;
        
        try {
            setError("");
            await addMemberToChatroom(activeChatroom.id, searchTerm);
            setSearchTerm("");
            setSearchResults([]);
            setError("Member added successfully!");
            setTimeout(() => setError(""), 3000);
        } catch (error) {
            setError("Failed to add member: " + error.message);
        }
    };
    
    const handleLeaveChatroom = async () => {
        if (!activeChatroom) return;
        
        if (window.confirm("Are you sure you want to leave this chatroom?")) {
            try {
                // Check if user is the creator and only member
                const isCreator = activeChatroom.createdBy === auth.currentUser.uid;
                const isOnlyMember = members.length === 1;
                
                await leaveChatroom(activeChatroom.id);
                setActiveChatroom(null);
                setShowSettingsPanel(false);
                
                // Show appropriate success message
                if (isCreator && isOnlyMember) {
                    setError("Chatroom deleted successfully.");
                } else {
                    setError("You have left the chatroom successfully.");
                }
                
                setTimeout(() => setError(""), 3000);
            } catch (error) {
                console.error("Leave chatroom error:", error);
                // Handle even permission errors gracefully
                if (error.message.includes("PERMISSION_DENIED")) {
                    setActiveChatroom(null);
                    setShowSettingsPanel(false);
                    setError("You have left the chatroom successfully.");
                    setTimeout(() => setError(""), 3000);
                } else {
                    setError("Failed to leave chatroom: " + error.message);
                }
            }
        }
    };
    
    const toggleSettingsPanel = () => {
        setShowSettingsPanel(!showSettingsPanel);
    };
    
    // Initialize notifications when user logs in
    useEffect(() => {
      // Auto-request notification permission when user is authenticated
      if (user) {
        // Small delay to not show the permission dialog immediately after login
        const timer = setTimeout(async () => {
          const enabled = await initializeNotifications();
          setNotificationsEnabled(enabled);
        }, 2000); // 2 second delay for better user experience
        
        return () => clearTimeout(timer);
      }
    }, [user]);
    
    // Handle notification click to set the active chatroom
    const handleNotificationClick = useCallback((chatroomId) => {
        const chatroom = chatrooms.find(c => c.id === chatroomId);
        if (chatroom) {
            setActiveChatroom(chatroom);
        }
    }, [chatrooms]);
    
    // Setup message notification listeners - FIXED VERSION
    useEffect(() => {
        let unsubscribe = () => {}; // Default no-op cleanup function
        
        // Move the conditional check inside the effect
        if (user && notificationsEnabled && chatrooms.length) {
            unsubscribe = setupMessageNotifications(
                chatrooms,
                activeChatroom?.id,
                user.uid,
                getChatroomMessages,
                handleNotificationClick
            );
        }
        
        // Return the cleanup function
        return () => {
            unsubscribe();
        };
    }, [user, chatrooms, activeChatroom, notificationsEnabled, handleNotificationClick]);
    
    // Update the handleMessageContextMenu function
    const handleMessageContextMenu = (event, message) => {
        // Only show context menu on user's own messages
        if (message.userId === auth.currentUser?.uid) {
            // Prevent default browser context menu
            event.preventDefault();
            // Stop propagation to avoid immediate closure
            event.stopPropagation();
            
            // Get window dimensions and cursor position
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const clickX = event.pageX;
            const clickY = event.pageY;
            
            // Context menu dimensions (approximate)
            const menuWidth = 180;
            const menuHeight = 50;
            
            // Calculate position, ensuring menu stays visible on screen
            const x = (clickX + menuWidth > windowWidth) 
                ? windowWidth - menuWidth - 10 
                : clickX;
                
            const y = (clickY + menuHeight > windowHeight)
                ? windowHeight - menuHeight - 10
                : clickY;
            
            // Show our custom context menu at calculated position
            setContextMenu({
                visible: true,
                x: x,
                y: y
            });
            
            // Store which message was clicked
            setSelectedMessage(message);
        }
    };
    
    // Add function to handle unsend message action
    const handleUnsendMessage = async () => {
        if (!selectedMessage || !activeChatroom) return;
        
        try {
            await unsendMessage(activeChatroom.id, selectedMessage.id);
            // Close context menu after action
            setContextMenu({ visible: false, x: 0, y: 0 });
            setSelectedMessage(null);
        } catch (error) {
            setError("Failed to unsend message: " + error.message);
        }
    };
    
    // Add these handlers for touch devices
    const handleTouchStart = (e, message) => {
        // Only for user's own messages
        if (message.userId === auth.currentUser?.uid) {
            const timer = setTimeout(() => {
                // Show context menu where the touch happened
                setContextMenu({
                    visible: true,
                    x: e.touches[0].pageX,
                    y: e.touches[0].pageY
                });
                setSelectedMessage(message);
            }, 800); // 800ms long press
            
            setLongPressTimer(timer);
        }
    };

    const handleTouchEnd = () => {
        // Clear the timer if touch ends before long press is detected
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };
    
    // AFTER all hooks are defined, THEN you can have conditional returns
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
                                onClick={() => setActiveChatroom(chatroom)}
                            >
                                <div className="chatroom-info">
                                    <h3>{chatroom.name}</h3>
                                    <p>{chatroom.description}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="user-controls">
                    <Link to="/profile" className="profile-button">
                        <i className="bi bi-person-circle"></i> Edit Profile
                    </Link>
                    <button onClick={handleSignOut} className="sign-out-button">
                        <i className="bi bi-box-arrow-right"></i> Sign Out
                    </button>
                </div>
            </div>
            
            <div className="chat-area">
                {activeChatroom ? (
                    <>
                        <div className="chat-header">
                            <div className="chatroom-info">
                                <h2>{activeChatroom.name}</h2>
                                <p>{activeChatroom.description}</p>
                            </div>
                            
                            <button 
                                className="settings-button"
                                onClick={toggleSettingsPanel}
                                aria-label="Chatroom settings"
                            >
                                <i className="bi bi-gear-fill"></i>
                            </button>
                        </div>
                        
                        <div className="messages-container">
                            {messages.length === 0 ? (
                                <div className="no-messages">
                                    <i className="bi bi-chat-left-text message-icon"></i>
                                    Be the first to send a message!
                                </div>
                            ) : (
                                <>
                                    {messages.map((message) => (
                                        <div 
                                            key={message.id}
                                            className={`message ${message.userId === auth.currentUser?.uid ? 'own-message' : 'other-message'}`}
                                            onContextMenu={(e) => handleMessageContextMenu(e, message)}
                                            onTouchStart={(e) => handleTouchStart(e, message)}
                                            onTouchEnd={handleTouchEnd}
                                            onTouchMove={handleTouchEnd}
                                        >
                                            <div className="message-header">
                                                <div className="message-avatar">
                                                    {message.photoURL ? (
                                                        <img 
                                                            src={message.photoURL} 
                                                            alt={message.displayName} 
                                                            className="message-avatar-img" 
                                                        />
                                                    ) : (
                                                        <div className="message-avatar-placeholder">
                                                            <i className="bi bi-person"></i>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="message-sender">{message.displayName}</div>
                                            </div>
                                            <div className="message-content">{message.text}</div>
                                            <div className="message-timestamp">
                                                {message.timestamp ? new Date(message.timestamp).toLocaleString() : 'Sending...'}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </>
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
                        <p>You can add any new chat member for your chatroom.</p>
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
                        <h4>Members ({members.length})</h4>
                        <div className="members-list">
                            {members.length === 0 ? (
                                <p>Loading members...</p>
                            ) : (
                                <ul className="members-list-container">
                                    {members.map((member) => (
                                        <li key={member.uid} className="member-item">
                                            <div className="member-info">
                                                {/* Show profile photo if available */}
                                                {member.photoURL ? (
                                                    <img 
                                                        src={member.photoURL} 
                                                        alt={member.displayName} 
                                                        className="member-avatar"
                                                    />
                                                ) : (
                                                    <div className="member-avatar-placeholder">
                                                        <i className="bi bi-person"></i>
                                                    </div>
                                                )}
                                                <span className="member-name">
                                                    {member.displayName}
                                                </span>
                                            </div>
                                            {member.uid === activeChatroom?.createdBy && (
                                                <span className="owner-badge">Owner</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    
                    <div className="settings-section">
                        <h4>Add Member</h4>
                        <div className="search-member-container">
                            <div className="search-input-wrapper">
                                <input
                                    type="text"
                                    className="search-member-input"
                                    placeholder="Search by username or email"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {isSearching && <div className="search-loading"><i className="bi bi-hourglass-split"></i></div>}
                            </div>
                            
                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    {searchResults.map(user => (
                                        <div 
                                            key={user.uid} 
                                            className="search-result-item"
                                            onClick={() => handleSelectUser(user)}
                                        >
                                            <div className="user-avatar">
                                                {user.photoURL ? (
                                                    <img 
                                                        src={user.photoURL} 
                                                        alt={user.displayName} 
                                                        className="search-avatar"
                                                    />
                                                ) : (
                                                    <div className="search-avatar-placeholder">
                                                        <i className="bi bi-person"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="user-details">
                                                <div className="user-name">{user.displayName}</div>
                                                <div className="user-email">{user.email}</div>
                                            </div>
                                            <button 
                                                type="button" 
                                                className="add-user-button"
                                                aria-label="Add user"
                                            >
                                                <i className="bi bi-plus-circle"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {searchTerm && searchResults.length === 0 && !isSearching && (
                                <div className="no-results">No users found</div>
                            )}
                            
                            <form className="add-member-form" onSubmit={handleAddMember}>
                                <button 
                                    type="submit" 
                                    disabled={!searchTerm.trim() || searchTerm.length < 3}
                                >
                                    Add by Email
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    <div className="settings-section danger-zone">
                        <h4>Danger Zone</h4>
                        <button 
                            onClick={handleLeaveChatroom} 
                            className="leave-button"
                        >
                            <i className="bi bi-box-arrow-right"></i> Leave Chatroom
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

            {/* Message context menu */}
            {contextMenu.visible && (
                <div 
                    ref={contextMenuRef}
                    className="message-context-menu"
                    style={{ 
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x
                    }}
                >
                    <button className="unsend-button" onClick={handleUnsendMessage}>
                        <i className="bi bi-trash"></i> Unsend Message
                    </button>
                    <button className="close-button" onClick={() => {
                        setContextMenu({ visible: false, x: 0, y: 0 });
                        setSelectedMessage(null);
                    }}>
                        <i className="bi bi-x-circle"></i> Close
                    </button>
                </div>
            )}
        </div>
    );
}

export default Chatrooms;