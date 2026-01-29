
export const userSessions = new Map();

export const globalStats = {
    totalMessagesProcessed: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    privatePhotosSent: 0,
    startTime: new Date(),
    totalUsers: 0
};

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

export function incrementImageCount(userId) {
    const session = userSessions.get(userId);
    if (session) {
        session.imageCount = (session.imageCount || 0) + 1;
        return session.imageCount;
    }
    return 0;
}
