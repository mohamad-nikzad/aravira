import type { User } from '@repo/salon-core/types';
export declare function createSession(userId: string): Promise<string>;
export declare function verifySession(token: string): Promise<string | null>;
export declare function getCurrentUser(): Promise<User | null>;
export declare function login(phone: string, password: string): Promise<{
    user: User;
    token: string;
} | null>;
export declare function logout(): Promise<void>;
