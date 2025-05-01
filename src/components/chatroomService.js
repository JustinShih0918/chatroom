import { 
  ref, 
  set, 
  push, 
  onValue, 
  get, 
  query, 
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
      [user.uid]: true 
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
  
  const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
  const chatroomSnapshot = await get(chatroomRef);
  
  if (!chatroomSnapshot.exists()) {
    throw new Error("Chatroom not found");
  }
  
  const chatroom = chatroomSnapshot.val();
  
  if (!chatroom.members || !chatroom.members[currentUser.uid]) {
    throw new Error("You must be a member of this chatroom to add others");
  }
  
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
  
  try {
    const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
    const snapshot = await get(chatroomRef);
    
    if (!snapshot.exists()) {
      throw new Error("Chatroom not found");
    }
    
    const chatroom = snapshot.val();
    const members = Object.keys(chatroom.members || {});
    const isCreator = chatroom.createdBy === user.uid;
    const isOnlyMember = members.length === 1 && members.includes(user.uid);
    
    if (isCreator && isOnlyMember) {
      try {
        await remove(ref(db, `chatrooms/${chatroomId}/members`));
        
        await remove(ref(db, `messages/${chatroomId}`));
        
        await remove(chatroomRef);
        
        return;
      } catch (deleteError) {
        console.error("Error during chatroom deletion: ", deleteError);
      }
    }
    
    const memberRef = ref(db, `chatrooms/${chatroomId}/members/${user.uid}`);
    await remove(memberRef);
    
    if (isCreator && members.length > 1) {
      const newOwner = members.find(memberId => memberId !== user.uid);
      if (newOwner) {
        await update(chatroomRef, { createdBy: newOwner });
      }
    }
  } catch (error) {
    console.error("Leave chatroom error:", error);
    throw error;
  }
};

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

export const listenToChatroomMembers = (chatroomId, callback) => {
  const membersRef = ref(db, `chatrooms/${chatroomId}/members`);
  
  const unsubscribe = onValue(membersRef, async (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const memberIds = Object.keys(snapshot.val() || {});
    const members = [];
    
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
    
    callback(members);
  });
  
  return unsubscribe;
};

// search users by username or email
export const searchUsers = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }
  
  searchTerm = searchTerm.toLowerCase().trim();
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");
  
  const usersRef = ref(db, "users");
  const snapshot = await get(usersRef);
  
  const results = [];
  
  snapshot.forEach((childSnapshot) => {
    const userData = childSnapshot.val();
    const uid = childSnapshot.key;
    
    if (uid === user.uid) return;
    
    const displayName = (userData.displayName || "").toLowerCase();
    const email = (userData.email || "").toLowerCase();
    
    if (displayName.includes(searchTerm) || email.includes(searchTerm)) {
      results.push({
        uid,
        email: userData.email,
        displayName: userData.displayName || userData.email.split('@')[0],
        photoURL: userData.photoURL,
      });
    }
  });
  
  return results;
};

export const searchMessages = async (chatroomId, searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }
  
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");
  
  // Verify user is member of the chatroom
  const chatroomRef = ref(db, `chatrooms/${chatroomId}`);
  const chatroomSnapshot = await get(chatroomRef);
  
  if (!chatroomSnapshot.exists()) {
    throw new Error("Chatroom not found");
  }
  
  const chatroom = chatroomSnapshot.val();
  if (!chatroom.members || !chatroom.members[user.uid]) {
    throw new Error("You must be a member of this chatroom to search messages");
  }
  
  // Get all messages for the chatroom
  const messagesRef = ref(db, `messages/${chatroomId}`);
  const messagesSnapshot = await get(messagesRef);
  
  if (!messagesSnapshot.exists()) {
    return [];
  }
  
  const results = [];
  const searchTermLower = searchTerm.toLowerCase();
  
  messagesSnapshot.forEach((childSnapshot) => {
    const message = childSnapshot.val();
    const messageId = childSnapshot.key;
    
    // Search in message text
    if (message.text && message.text.toLowerCase().includes(searchTermLower)) {
      results.push({
        id: messageId,
        ...message
      });
    }
  });
  
  // Sort results by timestamp 
  results.sort((a, b) => {
    const timestampA = a.timestamp || 0;
    const timestampB = b.timestamp || 0;
    return timestampB - timestampA;
  });
  
  return results;
};

// unsend messages
export const unsendMessage = async (chatroomId, messageId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in");
  
  const messageRef = ref(db, `messages/${chatroomId}/${messageId}`);
  const snapshot = await get(messageRef);
  
  if (!snapshot.exists()) {
    throw new Error("Message not found");
  }
  
  const message = snapshot.val();
  
  if (message.userId !== user.uid) {
    throw new Error("You can only unsend your own messages");
  }
  
  await remove(messageRef);
};