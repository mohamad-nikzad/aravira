import type { User, Service, Client, ClientTag, ClientFollowUp, Appointment, AppointmentWithDetails, BusinessHours, StaffSchedule, ClientSummary, TodayData, RetentionItem, FollowUpReason, FollowUpStatus } from '@repo/salon-core/types';
import { type StaffAvailabilityResult } from '@repo/salon-core/staff-availability';
export declare function getUserByPhone(phone: string): Promise<User | undefined>;
export declare function getUserWithPasswordByPhone(phone: string): Promise<(User & {
    passwordHash: string;
}) | undefined>;
export declare function getUserById(id: string): Promise<User | undefined>;
export declare function getAllStaff(salonId: string): Promise<User[]>;
export declare function staffMayPerformService(staffId: string, serviceId: string, salonId: string): Promise<boolean>;
export declare function getUserWithServiceIds(id: string, salonId: string): Promise<User | undefined>;
/** `null` or empty after delete = unrestricted (همه خدمات فعال). */
export declare function setStaffServiceIds(staffUserId: string, serviceIds: string[] | null, salonId: string): Promise<void>;
export declare function validateActiveServiceIds(ids: string[], salonId: string): Promise<boolean>;
export declare function createUser(input: Omit<User, 'id' | 'createdAt'> & {
    password: string;
}): Promise<User>;
export declare function getAllServices(salonId: string, includeInactive?: boolean): Promise<Service[]>;
export declare function getServiceById(id: string, salonId: string): Promise<Service | undefined>;
export declare function createService(input: Omit<Service, 'id' | 'active'> & {
    active?: boolean;
    salonId: string;
}): Promise<Service>;
export declare function updateService(id: string, salonId: string, data: Partial<Omit<Service, 'id'>>): Promise<Service | undefined>;
export declare function getAllClients(salonId: string): Promise<Client[]>;
export declare function getClientById(id: string, salonId: string): Promise<Client | undefined>;
export declare function createClient(input: Omit<Client, 'id' | 'createdAt'> & {
    salonId: string;
}): Promise<Client>;
export declare function updateClient(id: string, salonId: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client | undefined>;
export declare function getClientTags(clientId: string, salonId: string): Promise<ClientTag[]>;
export declare function getClientTagsForClients(clientIds: string[], salonId: string): Promise<Map<string, ClientTag[]>>;
export declare function setClientTags(clientId: string, salonId: string, labels: string[]): Promise<ClientTag[]>;
export declare function getAppointmentsByDateRange(salonId: string, startDate: string, endDate: string, staffIdFilter?: string): Promise<Appointment[]>;
export declare function getAppointmentsWithDetailsByDateRange(salonId: string, startDate: string, endDate: string, staffIdFilter?: string): Promise<AppointmentWithDetails[]>;
export declare function getClientAppointmentsWithDetails(salonId: string, clientId: string): Promise<AppointmentWithDetails[]>;
export declare function getAppointmentById(id: string, salonId: string): Promise<Appointment | undefined>;
export declare function createAppointment(apt: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>, salonId: string, createdByUserId?: string): Promise<Appointment>;
export declare function updateAppointment(id: string, salonId: string, data: Partial<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Appointment | undefined>;
export declare function deleteAppointment(id: string, salonId: string): Promise<boolean>;
export declare function getScheduleOverlapFlags(salonId: string, staffId: string, clientId: string, date: string, startTime: string, endTime: string, excludeId?: string): Promise<import("@repo/salon-core/appointment-conflict").ScheduleOverlapFlags>;
export declare function getBusinessSettings(salonId: string): Promise<BusinessHours>;
export declare function getStaffScheduleForDay(salonId: string, staffId: string, dayOfWeek: number): Promise<StaffSchedule | undefined>;
export declare function getStaffScheduleForDayAnyStatus(salonId: string, staffId: string, dayOfWeek: number): Promise<StaffSchedule | undefined>;
export declare function getStaffSchedules(salonId: string, staffId: string): Promise<StaffSchedule[]>;
export declare function setStaffSchedules(salonId: string, staffId: string, schedule: Array<{
    dayOfWeek: number;
    active: boolean;
    workingStart: string;
    workingEnd: string;
}>): Promise<StaffSchedule[]>;
export declare function checkStaffAvailabilityForAppointment(salonId: string, staffId: string, date: string, startTime: string, endTime: string): Promise<StaffAvailabilityResult>;
export declare function getStaffBookingAvailabilityForSlot(salonId: string, date: string, startTime: string, endTime: string): Promise<Array<{
    staffId: string;
    available: boolean;
    reason?: string;
}>>;
export declare function getClientSummary(salonId: string, clientId: string): Promise<ClientSummary | null>;
export declare function getClientFollowUps(salonId: string, options?: {
    clientId?: string;
    status?: FollowUpStatus;
}): Promise<ClientFollowUp[]>;
export declare function createClientFollowUp(salonId: string, clientId: string, reason: FollowUpReason, dueDate?: string): Promise<ClientFollowUp>;
export declare function updateClientFollowUpStatus(salonId: string, id: string, status: FollowUpStatus): Promise<ClientFollowUp | undefined>;
export declare function getTodayData(salonId: string, date?: string, staffIdFilter?: string): Promise<TodayData>;
export declare function getRetentionQueue(salonId: string): Promise<RetentionItem[]>;
export declare function getEffectiveBusinessHours(salonId: string, options?: {
    staffId?: string;
    dayOfWeek?: number;
}): Promise<BusinessHours>;
export type PushSubscriptionKeys = {
    endpoint: string;
    p256dh: string;
    auth: string;
};
export declare function upsertPushSubscription(userId: string, salonId: string, keys: PushSubscriptionKeys): Promise<void>;
export declare function getPushSubscriptionsForUser(userId: string, salonId?: string): Promise<PushSubscriptionKeys[]>;
export declare function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void>;
export declare function deletePushSubscriptionForUser(userId: string, salonId: string, endpoint: string): Promise<boolean>;
export declare function updateBusinessSettings(salonId: string, data: Partial<BusinessHours>): Promise<BusinessHours>;
export type OnboardingStatus = {
    salon: {
        id: string;
        name: string;
        slug: string;
        phone: string | null;
        address: string | null;
    } | null;
    steps: {
        profileConfirmed: boolean;
        businessHoursSet: boolean;
        servicesAdded: boolean;
        staffAdded: boolean;
        firstAppointmentCreated: boolean;
    };
    completedAt: Date | null;
    skippedAt: Date | null;
};
export type OnboardingAction = 'confirm-profile' | 'complete' | 'skip' | 'reopen';
export declare function getOnboardingStatus(salonId: string): Promise<OnboardingStatus>;
export declare function updateOnboardingState(salonId: string, action: OnboardingAction): Promise<OnboardingStatus>;
