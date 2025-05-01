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
 * Sanitize text to prevent XSS attacks
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
const sanitizeText = (text) => {
  if (!text) return '';
  
  const temp = document.createElement('div');
  temp.textContent = text;
  return temp.textContent;
};

/**
 * Format timestamp for display in notifications
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted time string
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * Show a notification for a new chat message
 * @param {string} senderName - Name of message sender
 * @param {string} chatroomName - Name of the chatroom
 * @param {string} message - Message content
 * @param {string} chatroomId - ID of the chatroom
 * @param {string} photoURL - Optional URL of sender's profile photo
 * @param {number} timestamp - Message timestamp
 * @param {Function} onClickCallback - Callback to run when notification is clicked
 * @returns {Notification|null} The notification object or null if not shown
 */
export const showMessageNotification = (
  senderName, 
  chatroomName, 
  message, 
  chatroomId,
  photoURL = null,
  timestamp = null,
  onClickCallback = null
) => {
  if (Notification.permission !== 'granted') {
    console.log("Notification permission not granted");
    return null;
  }

  const safeSenderName = sanitizeText(senderName);
  const safeChatroomName = sanitizeText(chatroomName);
  const safeMessage = sanitizeText(message);
  
  const timeStr = formatTimestamp(timestamp);

  const truncatedMessage = safeMessage.length > 50 
    ? safeMessage.substring(0, 47) + '...' 
    : safeMessage;
    
  const messageWithTime = timeStr 
    ? `[${timeStr}] ${truncatedMessage}` 
    : truncatedMessage;

  const options = {
    body: messageWithTime,
    icon: photoURL || '/icon.png',
    badge: '/icon.png',
    tag: `chatroom-${chatroomId}`,
    requireInteraction: false,
    silent: false,
    data: {
      chatroomId: chatroomId,
      timestamp: Date.now()
    }
  };

  const notification = new Notification(`${safeSenderName} in ${safeChatroomName}`, options);

  // Add click handler
  notification.onclick = function() {
    window.focus();
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
  if (isAppInFocus() && currentChatroomId === messageChatroomId) {
    return false;
  }
  
  return true;
};