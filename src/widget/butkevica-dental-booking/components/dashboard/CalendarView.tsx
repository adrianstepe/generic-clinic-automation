import React from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { lv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Booking {
    id: string;
    start_time: string;
    customer_name: string;
    service_name: string;
    doctor_id?: string;
    doctor_name?: string;
    duration?: number;
}

interface CalendarViewProps {
    bookings: Booking[];
}

// Helper to extract raw hour from ISO string without timezone conversion
// Database stores times as UTC but they actually represent Riga local time
const getRawHour = (isoString: string): number => {
    const match = isoString.match(/[T\s](\d{2}):/);
    return match ? parseInt(match[1], 10) : 0;
};

// Helper to extract raw date components for comparison
const getRawDateParts = (isoString: string): { year: number; month: number; day: number } => {
    const match = isoString.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return {
            year: parseInt(match[1], 10),
            month: parseInt(match[2], 10) - 1, // JavaScript months are 0-indexed
            day: parseInt(match[3], 10)
        };
    }
    return { year: 0, month: 0, day: 0 };
};

const CalendarView: React.FC<CalendarViewProps> = ({ bookings }) => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday

    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    const hours = Array.from({ length: 9 }).map((_, i) => i + 9); // 9 AM to 5 PM

    const getBookingsForSlot = (day: Date, hour: number) => {
        return bookings.filter(b => {
            const rawParts = getRawDateParts(b.start_time);
            const rawHour = getRawHour(b.start_time);

            // Compare using raw extracted values to avoid timezone conversion
            const isSameRawDay =
                day.getFullYear() === rawParts.year &&
                day.getMonth() === rawParts.month &&
                day.getDate() === rawParts.day;

            return isSameRawDay && rawHour === hour;
        });
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Nedēļas grafiks</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, -7))}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {format(startDate, 'd. MMM', { locale: lv })} - {format(addDays(startDate, 6), 'd. MMM', { locale: lv })}
                    </span>
                    <button
                        onClick={() => setCurrentDate(addDays(currentDate, 7))}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-slate-800">
                <div className="grid grid-cols-8">
                    {/* Time Column */}
                    <div className="border-r border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="h-10 border-b border-gray-100 dark:border-slate-700"></div> {/* Header spacer */}
                        {hours.map(hour => (
                            <div key={hour} className="h-20 border-b border-gray-100 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 font-medium flex items-start justify-center pt-2">
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {weekDays.map((day, dayIndex) => (
                        <div key={dayIndex} className="flex-1 border-r border-gray-100 dark:border-slate-700 last:border-r-0">
                            <div className="h-10 border-b border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-slate-700/30">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{format(day, 'EEE', { locale: lv })}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">{format(day, 'd')}</span>
                            </div>

                            {hours.map(hour => {
                                const slotBookings = getBookingsForSlot(day, hour);
                                return (
                                    <div key={hour} className="h-20 border-b border-gray-100 dark:border-slate-700 relative p-1 group">
                                        {slotBookings.map((booking, i) => (
                                            <div
                                                key={booking.id}
                                                className="absolute inset-x-1 top-1 bottom-1 bg-teal-100 dark:bg-teal-600 border border-teal-200 dark:border-teal-500 rounded-md p-1.5 overflow-hidden hover:z-10 hover:shadow-md transition-all cursor-pointer flex flex-col justify-center"
                                                style={{ top: `${i * 5}px`, left: `${i * 5}px`, right: `${5 - i * 5}px` }}
                                                title={`${booking.customer_name} - ${booking.service_name} (${booking.duration || 30} min)`}
                                            >
                                                <div className="text-[10px] font-bold text-teal-800 dark:text-white truncate">{booking.customer_name}</div>
                                                <div className="text-[9px] text-teal-600 dark:text-teal-100 truncate">{booking.service_name}</div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
