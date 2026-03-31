import { BlockConfig } from "../../schema/index.js";
export declare const tablePropSchema: {
    textColor: {
        default: "default";
    };
};
export type TableBlockConfig = BlockConfig<"table", {
    textColor: {
        default: "default";
    };
}, "table">;
export declare const createTableBlockSpec: () => import("../../index.js").LooseBlockSpec<"table", {
    textColor: {
        default: "default";
    };
}, "table">;
declare module "@tiptap/core" {
    interface NodeConfig {
        tableRole?: string;
    }
}
