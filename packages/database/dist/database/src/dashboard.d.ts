import { getTodayData } from './internal/queries';
export declare function getDashboardData(salonId: string): Promise<{
    totalClients: number;
    totalStaff: number;
    todayAppointments: number;
    weekAppointments: number;
    monthAppointments: number;
    todayStatusBreakdown: {
        status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
        count: number;
    }[];
    monthStatusBreakdown: {
        status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no-show";
        count: number;
    }[];
    popularServices: {
        name: string;
        count: number;
    }[];
    staffLoad: {
        name: string;
        color: string;
        count: number;
    }[];
    monthRevenue: number;
    newClientsThisMonth: number;
}>;
export { getTodayData };
