import { NextResponse } from 'next/server';
import type { User } from '@repo/salon-core/types';
export declare function requireManager(user: User | null): user is User;
export declare function unauthorized(message?: string): NextResponse<{
    error: string;
}>;
export declare function forbidden(message?: string): NextResponse<{
    error: string;
}>;
