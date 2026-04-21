interface TimePickerProps {
    value: string;
    onChange: (time: string) => void;
    id?: string;
    label?: string;
}
export declare function TimePicker({ value, onChange, id, label }: TimePickerProps): import("react/jsx-runtime").JSX.Element;
export {};
