import { 
  ref, 
  set, 
  push, 
  onValue, 
  get, 
  query, 
  orderByChild, 
  update,
  remove,
  serverTimestamp 
} from "firebase/database";
import { db, auth } from "../config";

// Get all chatrooms the user is a member of
export const getUserChatrooms = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    callback([]);
    return () => {};
  }

  const chatroomsRef = ref(db, "chatrooms");
  
  const unsubscribe = onValue(chatroomsRef, (snapshot) => {
    const chatrooms = [];
    snapshot.forEach((childSnapshot) => {
      const chatroom = childSnapshot.val();
      const id = childSnapshot.key;
      
      // Only include chatrooms where user is a member
      if (chatroom.members && chatroom.members[user.uid]) {
        chatrooms.push({ id, ...chatroom });
      }
    });
    
    callback(chatrooms);
  });
  
  return unsubscribe;
};

// Create a new chatroom
export const createChatroom = async (name, description) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");

  const chatroomsRef = ref(db, "chatrooms");
  const newChatroomRef = push(chatroomsRef);
  
  const chatroom = {
    name,
    description,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    members: {
      [user.uid]: true // Add creator as first member
    }
  };
  
  await set(newChatroomRef, chatroom);
  return newChatroomRef.key;
};

// Get messages for a chatroom
export const getChatroomMessages = (chatroomId, callback) => {
  const messagesRef = ref(db, `messages/${chatroomId}`);
  
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      messages.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // Sort messages by timestamp
    messages.sort((a, b) => {
      // Handle case where timestamp might be null
      const timestampA = a.timestamp || 0;
      const timestampB = b.timestamp || 0;
      return timestampA - timestampB;
    });
    
    callback(messages);
  });
  
  return unsubscribe;
};

// Send a message to a chatroom
export const sendMessage = async (chatroomId, text) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");
  
  // Get the latest user profile information
  const userRef = ref(db, `users/${user.uid}`);
  const userSnapshot = await get(userRef);
  const userData = userSnapshot.exists() ? userSnapshot.val() : {};
  
  const messagesRef = ref(db, `messages/${chatroomId}`);
  const newMessageRef = push(messagesRef);
  
  const message = {
    text,
    userId: user.uid,
    displayName: userData.displayName || user.displayName || user.email.split('@')[0],
    photoURL: userData.photoURL || user.photoURL || null,
    timestamp: serverTimestamp()
  };
  
  await set(newMessageRef, message);
};

// Add a member to a chatroom by email
export const addMemberToChatroom = async (chatroomId, email) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("You must be logged in");
  
  // First verify that the current user is a member of the chatroom
  const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
  const chatroomSnapshot = await get(chatroomRef);
  
  if (!chatroomSnapshot.exists()) {
    throw new Error("Chatroom not found");
  }
  
  const chatroom = chatroomSnapshot.val();
  
  // Check if current user is a member
  if (!chatroom.members || !chatroom.members[currentUser.uid]) {
    throw new Error("You must be a member of this chatroom to add others");
  }
  
  // Find user by email
  const usersRef = ref(db, "users");
  const snapshot = await get(query(usersRef));
  
  let userId = null;
  snapshot.forEach((childSnapshot) => {
    const userData = childSnapshot.val();
    if (userData.email === email) {
      userId = childSnapshot.key;
    }
  });
  
  if (!userId) {
    throw new Error("User not found. Make sure they have registered.");
  }
  
  // Check if user is already a member
  if (chatroom.members && chatroom.members[userId]) {
    throw new Error("User is already a member of this chatroom");
  }
  
  // Add the member
  const memberRef = ref(db, `chatrooms/${chatroomId}/members/${userId}`);
  await set(memberRef, true);
  return true;
};

// Leave a chatroom
export const leaveChatroom = async (chatroomId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");
  
  const memberRef = ref(db, `chatrooms/${chatroomId}/members/${user.uid}`);
  await remove(memberRef);
  
  // Check if user is the creator, if yes, delete chatroom or transfer ownership
  const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
  const snapshot = await get(chatroomRef);
  if (snapshot.exists()) {
    const chatroom = snapshot.val();
    if (chatroom.createdBy === user.uid) {
      // If creator is leaving, check if there are other members
      const members = Object.keys(chatroom.members || {});
      if (members.length > 0) {
        // Transfer ownership to first member
        await update(chatroomRef, { createdBy: members[0] });
      } else {
        // Delete chatroom if no members left
        await remove(chatroomRef);
        // Also delete messages
        await remove(ref(db, `messages/${chatroomId}`));
      }
    }
  }
};

// Get all members of a chatroom
export const getChatroomMembers = async (chatroomId) => {
  const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
  const chatroomSnapshot = await get(chatroomRef);
  
  if (!chatroomSnapshot.exists()) {
    throw new Error("Chatroom not found");
  }
  
  const chatroom = chatroomSnapshot.val();
  const memberIds = Object.keys(chatroom.members || {});
  
  if (memberIds.length === 0) {
    return [];
  }
  
  const members = [];
  
  // Get each member's data from the users collection
  for (const uid of memberIds) {
    const userRef = ref(db, `users/${uid}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      members.push({
        uid,
        email: userData.email,
        displayName: userData.displayName || userData.email.split('@')[0],
        photoURL: userData.photoURL || null
      });
    }
  }
  
  return members;
};