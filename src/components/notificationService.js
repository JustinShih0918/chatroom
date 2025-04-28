// Chrome Notification Service for Chatroom App

/**
 * Check if browser supports notifications
 * @returns {boolean} Whether notifications are supported
 */
export const isNotificationSupported = () => {
  return "Notification" in window;
};

/**
 * Request permission to display notifications
 * @returns {Promise<string>} Permission status ('granted', 'denied', or 'default')
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.log("This browser does not support desktop notifications");
    return "unsupported";
  }

  // If permission is already granted, return it
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // If not denied, request permission
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return 'error';
    }
  }

  return Notification.permission;
};

/**
 * Show a notification for a new chat message
 * @param {string} senderName - Name of message sender
 * @param {string} chatroomName - Name of the chatroom
 * @param {string} message - Message content
 * @param {string} chatroomId - ID of the chatroom
 * @param {string} photoURL - Optional URL of sender's profile photo
 * @param {Function} onClickCallback - Callback to run when notification is clicked
 * @returns {Notification|null} The notification object or null if not shown
 */
export const showMessageNotification = (
  senderName, 
  chatroomName, 
  message, 
  chatroomId,
  photoURL = null,
  onClickCallback = null
) => {
  // Check permission first
  if (Notification.permission !== 'granted') {
    console.log("Notification permission not granted");
    return null;
  }

  // Truncate message if too long
  const truncatedMessage = message.length > 60 
    ? message.substring(0, 57) + '...' 
    : message;

  // Create notification options
  const options = {
    body: `${truncatedMessage}`,
    icon: photoURL || '/logo192.png', // Use sender photo or default app icon
    badge: '/logo192.png',
    tag: `chatroom-${chatroomId}`, // Tag with chatroom to avoid multiple notifications
    requireInteraction: false, // Auto-close after a while
    silent: false, // Play sound
    data: {
      chatroomId: chatroomId,
      timestamp: Date.now()
    }
  };

  // Create the notification
  const notification = new Notification(`${senderName} in ${chatroomName}`, options);

  // Add click handler
  notification.onclick = function() {
    // Focus the window
    window.focus();
    
    // Close the notification
    notification.close();
    
    // Run callback if provided
    if (typeof onClickCallback === 'function') {
      onClickCallback(chatroomId);
    }
  };

  return notification;
};

/**
 * Check if the app is currently in focus
 * @returns {boolean} Whether the app is in focus
 */
export const isAppInFocus = () => {
  return document.visibilityState === 'visible';
};

/**
 * Should notification be shown based on app state and user settings
 * @param {string} currentChatroomId - ID of the currently active chatroom
 * @param {string} messageChatroomId - ID of the chatroom where message was sent
 * @returns {boolean} Whether notification should be shown
 */
export const shouldShowNotification = (currentChatroomId, messageChatroomId) => {
  // Don't show notification if app is in focus and user is in the same chatroom
  if (isAppInFocus() && currentChatroomId === messageChatroomId) {
    return false;
  }
  
  return true;
};