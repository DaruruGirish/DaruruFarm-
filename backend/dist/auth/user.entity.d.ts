export declare class User {
    id: number;
    name: string;
    email: string;
    password: string | null;
    googleId: string | null;
    authProvider: string;
    plan: string;
    premiumUntil: Date | null;
    trialUsed: boolean;
}
