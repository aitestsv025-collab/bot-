
export const userSessions = new Map();

export const globalStats = {
    totalMessagesProcessed: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    privatePhotosSent: 0,
    startTime: new Date(),
    totalUsers: 0
};

export function isPremiumUser(userId) {
    const session = userSessions.get(userId);
    return session && session.isPremium && (session.expiry > Date.now());
}

export function incrementImageCount(userId) {
    const session = userSessions.get(userId);
    if (session) {
        session.imageCount = (session.imageCount || 0) + 1;
        return session.imageCount;
    }
    return 0;
}
