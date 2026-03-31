import { ThreadData } from "@blocknote/core/comments";
export type CommentsProps = {
    thread: ThreadData;
    maxCommentsBeforeCollapse?: number;
};
export declare const Comments: ({ thread, maxCommentsBeforeCollapse, }: CommentsProps) => import("react/jsx-runtime").JSX.Element[];
