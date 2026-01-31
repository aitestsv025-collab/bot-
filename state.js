
export const userSessions = new Map();

export const globalStats = {
    totalMessagesProcessed: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    privatePhotosSent: 0,
    startTime: new Date(),
    totalUsers: 0,
    lastPaymentError: null, 
    lastRawError: null,
    isCashfreeApproved: true,
    logs: [], // System activity logs
    chatHistory: [] // User-Bot conversation logs
};

export function addLog(message, type = 'info') {
    const log = {
        time: new Date().toLocaleTimeString(),
        message,
        type
    };
    globalStats.logs.unshift(log);
    if (globalStats.logs.length > 50) globalStats.logs.pop();
}

export function addChatLog(userId, userName, userMsg, botReply) {
    const chat = {
        time: new Date().toLocaleTimeString(),
        userId,
        userName,
        userMsg,
        botReply
    };
    globalStats.chatHistory.unshift(chat);
    if (globalStats.chatHistory.length > 100) globalStats.chatHistory.pop();
}

const NAMES = [
    "Riya", "Priya", "Sneha", "Ishani", "Kavya", "Ananya", "Sonia", "Meera", 
    "Tanya", "Nisha", "Simran", "Ayesha", "Zoya", "Kiara", "Shanaya"
];

export function getRandomName() {
    return NAMES[Math.floor(Math.random() * NAMES.length)];
}

export function isPremiumUser(userId) {
    const session = userSessions.get(userId);
    return session && session.isPremium && (session.expiry > Date.now());
}

export function incrementMessageCount(userId) {
    const session = userSessions.get(userId);
    if (session) {
        session.messageCount = (session.messageCount || 0) + 1;
        return session.messageCount;
    }
    return 0;
}

export function incrementNormalImageCount(userId) {
    const session = userSessions.get(userId);
    if (session) {
        session.normalImageCount = (session.normalImageCount || 0) + 1;
        return session.normalImageCount;
    }
    return 0;
}

export function incrementBoldImageCount(userId) {
    const session = userSessions.get(userId);
    if (session) {
        session.boldImageCount = (session.boldImageCount || 0) + 1;
        return session.boldImageCount;
    }
    return 0;
}

// Legacy function keeping for compatibility
export function incrementImageCount(userId) {
    return incrementNormalImageCount(userId);
}
