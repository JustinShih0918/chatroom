import { 
  showMessageNotification, 
  shouldShowNotification 
} from './notificationService';

/**
 * Initialize the notification system
 * @returns {Promise<boolean>} Whether notifications are enabled
 */
export const initializeNotifications = async () => {
  // If permission is already granted, return true
  if (Notification.permission === 'granted') {
    return true;
  }
  
  // If permission is denied, return false without prompting again
  if (Notification.permission === 'denied') {
    return false;
  }
  
  // Request permission using browser's native dialog
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

  // Track last seen message ID for each chatroom to avoid duplicate notifications
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
        // Show the notification with timestamp
        showMessageNotification(
          lastMessage.displayName,
          chatroom.name,
          lastMessage.text,
          chatroom.id,
          lastMessage.photoURL,
          lastMessage.timestamp, // Pass the timestamp to the notification function
          onNotificationClick
        );
      }
    });
  });
  
  // Return cleanup function
  return () => {
    unsubscribes.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
  };
};