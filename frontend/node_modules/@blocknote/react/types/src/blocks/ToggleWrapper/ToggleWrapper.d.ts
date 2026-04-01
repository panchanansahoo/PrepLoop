import { Block } from "@blocknote/core";
import { ReactNode } from "react";
import { ReactCustomBlockRenderProps } from "../../schema/ReactBlockSpec.js";
export declare const ToggleWrapper: (props: Omit<ReactCustomBlockRenderProps<any, any, any>, "contentRef"> & {
    children: ReactNode;
    toggledState?: {
        set: (block: Block<any, any, any>, isToggled: boolean) => void;
        get: (block: Block<any, any, any>) => boolean;
    };
}) => string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | import("react/jsx-runtime").JSX.Element | null | undefined;
