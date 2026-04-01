import { EditorState, Transaction } from "prosemirror-state";
export declare const splitBlockCommand: (posInBlock: number, keepType?: boolean, keepProps?: boolean) => ({ state, dispatch, }: {
    state: EditorState;
    dispatch: ((args?: any) => any) | undefined;
}) => boolean;
export declare const splitBlockTr: (tr: Transaction, posInBlock: number, keepType?: boolean, keepProps?: boolean) => boolean;
