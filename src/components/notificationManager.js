import { 
  showMessageNotification, 
  shouldShowNotification 
} from './notificationService';

/**
 * Initialize the notification system
 * @returns {Promise<boolean>} 
 */
export const initializeNotifications = async () => {
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

/**
 * Setup message listeners for notification
 * @param {Array} chatrooms - List of user's chatrooms
 * @param {string} activeChatroomId - ID of currently active chatroom
 * @param {string} currentUserId - ID of the current user
 * @param {Function} getChatroomMessages - Function to get chatroom messages
 * @param {Function} onNotificationClick - Function to handle notification clicks
 * @returns {Function} Cleanup function to remove listeners
 */
export const setupMessageNotifications = (
  chatrooms, 
  activeChatroomId, 
  currentUserId,
  getChatroomMessages,
  onNotificationClick
) => {
  if (!chatrooms || !chatrooms.length) {
    return () => {};
  }

  const lastSeenMessageIds = {};
  
  // Set up listeners for each chatroom
  const unsubscribes = chatrooms.map(chatroom => {
    return getChatroomMessages(chatroom.id, (messages) => {
      if (!messages || messages.length === 0) return;
      
      // Get the last message
      const lastMessage = messages[messages.length - 1];
      
      // Skip if it's from the current user
      if (lastMessage.userId === currentUserId) return;
      
      // Skip if we've already seen this message
      if (lastSeenMessageIds[chatroom.id] === lastMessage.id) return;
      
      // Update last seen message
      lastSeenMessageIds[chatroom.id] = lastMessage.id;
      
      // Check if we should show notification
      if (shouldShowNotification(activeChatroomId, chatroom.id)) {
        showMessageNotification(
          lastMessage.displayName,
          chatroom.name,
          lastMessage.text,
          chatroom.id,
          lastMessage.photoURL,
          lastMessage.timestamp,
          onNotificationClick
        );
      }
    });
  });
  
  return () => {
    unsubscribes.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
  };
};