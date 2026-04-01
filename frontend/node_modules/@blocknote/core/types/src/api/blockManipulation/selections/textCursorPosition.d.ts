import { type Transaction } from "prosemirror-state";
import type { TextCursorPosition } from "../../../editor/cursorPositionTypes.js";
import type { BlockIdentifier, BlockSchema, InlineContentSchema, StyleSchema } from "../../../schema/index.js";
export declare function getTextCursorPosition<BSchema extends BlockSchema, I extends InlineContentSchema, S extends StyleSchema>(tr: Transaction): TextCursorPosition<BSchema, I, S>;
export declare function setTextCursorPosition(tr: Transaction, targetBlock: BlockIdentifier, placement?: "start" | "end"): void;
