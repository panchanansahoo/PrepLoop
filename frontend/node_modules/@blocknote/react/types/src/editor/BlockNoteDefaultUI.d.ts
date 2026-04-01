export type BlockNoteDefaultUIProps = {
    /**
     * Whether the formatting toolbar should be enabled.
     * @see {@link https://blocknotejs.org/docs/react/components/formatting-toolbar}
     */
    formattingToolbar?: boolean;
    /**
     * Whether the link toolbar should be enabled.
     * @see {@link https://blocknotejs.org/docs/react/components/link-toolbar}
     */
    linkToolbar?: boolean;
    /**
     * Whether the slash menu should be enabled.
     * @see {@link https://blocknotejs.org/docs/react/components/suggestion-menus#slash-menu}
     */
    slashMenu?: boolean;
    /**
     * Whether the block side menu should be enabled.
     * @see {@link https://blocknotejs.org/docs/react/components/side-menu}
     */
    sideMenu?: boolean;
    /**
     * Whether the file panel should be enabled.
     * @see {@link https://blocknotejs.org/docs/react/components/file-panel}
     */
    filePanel?: boolean;
    /**
     * Whether the table handles should be enabled.
     * @see {@link https://blocknotejs.org/docs/react/components/table-handles}
     */
    tableHandles?: boolean;
    /**
     * Whether the emoji picker should be enabled.
     * @see {@link https://blocknotejs.org/docs/advanced/grid-suggestion-menus#emoji-picker}
     */
    emojiPicker?: boolean;
    /**
     * Whether the default comments UI feature should be enabled.
     * @see {@link https://blocknotejs.org/docs/react/components/comments}
     */
    comments?: boolean;
};
export declare function BlockNoteDefaultUI(props: BlockNoteDefaultUIProps): import("react/jsx-runtime").JSX.Element;
