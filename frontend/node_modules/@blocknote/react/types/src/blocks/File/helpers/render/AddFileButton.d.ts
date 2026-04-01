import { FileBlockConfig } from "@blocknote/core";
import { ReactNode } from "react";
import { ReactCustomBlockRenderProps } from "../../../../schema/ReactBlockSpec.js";
export declare const AddFileButton: (props: Omit<ReactCustomBlockRenderProps<FileBlockConfig["type"], FileBlockConfig["propSchema"], FileBlockConfig["content"]>, "contentRef"> & {
    buttonIcon?: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
