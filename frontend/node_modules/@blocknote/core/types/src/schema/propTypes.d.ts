export type PropSpec<PType extends boolean | number | string> = {
    default: PType;
    values?: readonly PType[];
} | {
    default: undefined;
    type: "string" | "number" | "boolean";
    values?: readonly PType[];
};
export type PropSchema = Record<string, PropSpec<boolean | number | string>>;
export type Props<PSchema extends PropSchema> = {
    [PName in keyof PSchema]: (NonNullable<PSchema[PName]> extends {
        default: boolean;
    } | {
        type: "boolean";
    } ? NonNullable<PSchema[PName]>["values"] extends readonly boolean[] ? NonNullable<PSchema[PName]>["values"][number] : boolean : NonNullable<PSchema[PName]> extends {
        default: number;
    } | {
        type: "number";
    } ? NonNullable<PSchema[PName]>["values"] extends readonly number[] ? NonNullable<PSchema[PName]>["values"][number] : number : NonNullable<PSchema[PName]> extends {
        default: string;
    } | {
        type: "string";
    } ? NonNullable<PSchema[PName]>["values"] extends readonly string[] ? NonNullable<PSchema[PName]>["values"][number] : string : never) extends infer T ? PSchema[PName] extends {
        optional: true;
    } ? T | undefined : T : never;
};
