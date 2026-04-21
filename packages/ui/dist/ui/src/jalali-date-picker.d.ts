interface JalaliDatePickerProps {
    value: string;
    onChange: (gregorianDate: string) => void;
    id?: string;
    required?: boolean;
    className?: string;
}
export declare function JalaliDatePicker({ value, onChange, id, className }: JalaliDatePickerProps): import("react/jsx-runtime").JSX.Element;
export {};
