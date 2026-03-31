export declare const SuggestionMenuItem: import("react").ForwardRefExoticComponent<{
    className?: string;
    id: string;
    isSelected: boolean;
    onClick: () => void;
    item: Omit<import("@blocknote/react").DefaultReactSuggestionItem, "onItemClick">;
} & import("react").RefAttributes<HTMLDivElement>>;
