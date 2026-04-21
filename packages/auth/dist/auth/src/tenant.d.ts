import type { UserRole } from '@repo/salon-core/types';
export type TenantUser = {
    userId: string;
    salonId: string;
    role: UserRole;
    name: string;
    phone: string;
};
export type TenantPermission = 'manage_settings' | 'manage_staff' | 'manage_services' | 'manage_clients' | 'manage_appointments' | 'view_dashboard' | 'view_own_appointments';
export declare function getTenantUser(): Promise<TenantUser | null>;
export declare function requireTenantUser(): Promise<TenantUser>;
export declare function isManagerRole(role: UserRole): boolean;
export declare function hasTenantPermission(role: UserRole, permission: TenantPermission): boolean;
export declare function requireTenantManager(): Promise<TenantUser>;
