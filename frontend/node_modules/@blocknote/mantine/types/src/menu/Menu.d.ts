import { ComponentProps } from "@blocknote/react";
export declare const Menu: (props: ComponentProps["Generic"]["Menu"]["Root"]) => import("react/jsx-runtime").JSX.Element;
export declare const MenuItem: import("react").ForwardRefExoticComponent<{
    className?: string;
    children?: import("react").ReactNode;
    subTrigger?: boolean;
    icon?: import("react").ReactNode;
    checked?: boolean;
    onClick?: () => void;
} & import("react").RefAttributes<HTMLButtonElement & HTMLDivElement>>;
export declare const MenuTrigger: (props: ComponentProps["Generic"]["Menu"]["Trigger"]) => import("react/jsx-runtime").JSX.Element;
export declare const MenuDropdown: import("react").ForwardRefExoticComponent<{
    className?: string;
    children?: import("react").ReactNode;
    sub?: boolean;
} & import("react").RefAttributes<HTMLDivElement>>;
export declare const MenuDivider: import("react").ForwardRefExoticComponent<{
    className?: string;
} & import("react").RefAttributes<HTMLDivElement>>;
export declare const MenuLabel: import("react").ForwardRefExoticComponent<{
    className?: string;
    children?: import("react").ReactNode;
} & import("react").RefAttributes<HTMLDivElement>>;
