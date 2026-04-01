export declare const TextInput: import("react").ForwardRefExoticComponent<{
    className?: string;
    name: string;
    label?: string;
    variant?: "default" | "large";
    icon: import("react").ReactNode;
    rightSection?: import("react").ReactNode;
    autoFocus?: boolean;
    placeholder?: string;
    disabled?: boolean;
    value: string;
    onKeyDown: (event: import("react").KeyboardEvent<HTMLInputElement>) => void;
    onChange: (event: import("react").ChangeEvent<HTMLInputElement>) => void;
    onSubmit?: () => void;
    autoComplete?: import("react").HTMLInputAutoCompleteAttribute;
} & import("react").RefAttributes<HTMLInputElement>>;
