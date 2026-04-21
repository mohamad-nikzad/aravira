import type { Service, User } from './types';
/** Active services this staff member may perform (null restriction = all active). */
export declare function eligibleServicesForStaff(staffMember: User, activeServices: Service[]): Service[];
export type AutoPickServiceOptions = {
    /**
     * When true, staff has an explicit `serviceIds` list (not “all services”).
     * If they can do several categories, we still pick one service so the form is usable;
     * unrestricted staff keeps `false` to avoid arbitrary picks.
     */
    staffHasExplicitServiceList?: boolean;
};
/**
 * Picks a service to pre-fill: one eligible; several same category → longest duration then name;
 * several mixed categories with explicit staff list → same preference across all eligible.
 */
export declare function autoPickServiceForStaff(eligible: Service[], options?: AutoPickServiceOptions): Service | null;
export declare function eligibleStaffForService(allStaff: User[], serviceId: string): User[];
export declare function autoPickStaffForService(allStaff: User[], serviceId: string): User | null;
