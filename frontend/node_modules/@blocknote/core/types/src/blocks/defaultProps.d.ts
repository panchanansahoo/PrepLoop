import { Attribute } from "@tiptap/core";
import type { Props } from "../schema/index.js";
export declare const defaultProps: {
    backgroundColor: {
        default: "default";
    };
    textColor: {
        default: "default";
    };
    textAlignment: {
        default: "left";
        values: readonly ["left", "center", "right", "justify"];
    };
};
export type DefaultProps = Props<typeof defaultProps>;
export declare const parseDefaultProps: (element: HTMLElement) => Partial<Props<{
    backgroundColor: {
        default: "default";
    };
    textColor: {
        default: "default";
    };
    textAlignment: {
        default: "left";
        values: readonly ["left", "center", "right", "justify"];
    };
}>>;
export declare const addDefaultPropsExternalHTML: (props: Partial<DefaultProps>, element: HTMLElement) => void;
export declare const getBackgroundColorAttribute: (attributeName?: string) => Attribute;
export declare const getTextColorAttribute: (attributeName?: string) => Attribute;
export declare const getTextAlignmentAttribute: (attributeName?: string) => Attribute;
