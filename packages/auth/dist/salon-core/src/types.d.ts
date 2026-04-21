export type UserRole = 'manager' | 'staff';
export interface User {
    id: string;
    salonId: string;
    name: string;
    role: UserRole;
    color: string;
    phone: string;
    createdAt: Date;
    /**
     * When omitted or `null`, the user may perform every active service.
     * When a non-empty array, only those services apply.
     */
    serviceIds?: string[] | null;
}
export interface Service {
    id: string;
    name: string;
    category: 'hair' | 'nails' | 'skincare' | 'spa';
    duration: number;
    price: number;
    color: string;
    active: boolean;
}
export interface Client {
    id: string;
    name: string;
    phone: string;
    notes?: string;
    createdAt: Date;
    tags?: ClientTag[];
}
export interface Appointment {
    id: string;
    clientId: string;
    staffId: string;
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface AppointmentWithDetails extends Appointment {
    client: Client;
    staff: User;
    service: Service;
}
export type CalendarView = 'day' | 'week' | 'month' | 'list';
export interface TimeSlot {
    time: string;
    available: boolean;
}
/** Default fallback when DB business_settings row is missing */
export declare const WORKING_HOURS: {
    readonly start: "09:00";
    readonly end: "19:00";
    readonly slotDuration: 30;
};
export interface BusinessHours {
    workingStart: string;
    workingEnd: string;
    slotDurationMinutes: number;
}
export interface StaffSchedule {
    id: string;
    salonId: string;
    staffId: string;
    dayOfWeek: number;
    workingStart: string;
    workingEnd: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ClientTag {
    id: string;
    salonId: string;
    clientId: string;
    label: string;
    color: string;
    createdAt: Date;
}
export type FollowUpReason = 'inactive' | 'no-show' | 'new-client' | 'vip' | 'manual';
export type FollowUpStatus = 'open' | 'reviewed' | 'dismissed';
export interface ClientFollowUp {
    id: string;
    salonId: string;
    clientId: string;
    reason: FollowUpReason;
    status: FollowUpStatus;
    dueDate: string;
    createdAt: Date;
    updatedAt: Date;
    reviewedAt: Date | null;
}
export interface ClientSummary {
    client: Client;
    tags: ClientTag[];
    upcomingAppointment: AppointmentWithDetails | null;
    history: AppointmentWithDetails[];
    stats: {
        completedCount: number;
        cancelledCount: number;
        noShowCount: number;
        estimatedSpend: number;
        lastVisitDate: string | null;
        favoriteServiceName: string | null;
        lastStaffName: string | null;
        totalCompletedVisits: number;
    };
    openFollowUps: ClientFollowUp[];
}
export interface TodayAttentionItem {
    id: string;
    type: 'soon' | 'overdue' | 'no-show-risk' | 'first-time' | 'vip';
    title: string;
    detail: string;
    appointmentId?: string;
    clientId?: string;
    priority: number;
}
export interface TodayData {
    date: string;
    counts: Record<Appointment['status'], number>;
    appointments: AppointmentWithDetails[];
    attentionItems: TodayAttentionItem[];
    staffLoad: Array<{
        staffId: string;
        staffName: string;
        appointmentCount: number;
        bookedMinutes: number;
    }>;
    openSlots: Array<{
        staffId: string;
        staffName: string;
        ranges: Array<{
            startTime: string;
            endTime: string;
        }>;
    }>;
}
export interface RetentionItem {
    id: string;
    client: Client;
    reason: FollowUpReason;
    status: FollowUpStatus;
    dueDate: string;
    lastVisitDate: string | null;
    lastServiceName: string | null;
    completedCount: number;
    estimatedSpend: number;
    noShowCount: number;
    suggestedReason: string;
}
export declare const SERVICE_CATEGORIES: {
    readonly hair: {
        readonly label: "مو";
        readonly color: "bg-staff-1";
    };
    readonly nails: {
        readonly label: "ناخن";
        readonly color: "bg-staff-2";
    };
    readonly skincare: {
        readonly label: "پوست";
        readonly color: "bg-staff-3";
    };
    readonly spa: {
        readonly label: "اسپا";
        readonly color: "bg-staff-4";
    };
};
export declare const STAFF_COLORS: readonly ["bg-staff-1", "bg-staff-2", "bg-staff-3", "bg-staff-4", "bg-staff-5"];
export declare const APPOINTMENT_STATUS: {
    readonly scheduled: {
        readonly label: "در انتظار";
        readonly color: "bg-muted text-muted-foreground";
    };
    readonly confirmed: {
        readonly label: "تایید شده";
        readonly color: "bg-primary/20 text-primary";
    };
    readonly completed: {
        readonly label: "انجام شده";
        readonly color: "bg-green-100 text-green-700";
    };
    readonly cancelled: {
        readonly label: "لغو شده";
        readonly color: "bg-destructive/20 text-destructive";
    };
    readonly 'no-show': {
        readonly label: "غیبت";
        readonly color: "bg-orange-100 text-orange-700";
    };
};
