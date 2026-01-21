import {Array, Number, Optional, Partial, Record, Static, String, Union} from "runtypes";

export const ListOfficersQueryParams = Partial({
    search: String,
    force: String,
    patent: String.withConstraint(s => !isNaN(parseInt(s))),
    "patent-category": String.withConstraint(s => !isNaN(parseInt(s))),
    status: String.withConstraint(s => !isNaN(parseInt(s))),
    patrol: String.withConstraint(s => s === "true" || s === "false")
});
export type ListOfficersQueryParams = Static<typeof ListOfficersQueryParams>;

export const GetOfficerQueryParams = Partial({
   patrol: String.withConstraint(s => s === "true" || s === "false")
});
export type GetOfficerQueryParams = Static<typeof GetOfficerQueryParams>;

export const CreateOfficerRequestBody = Record({
    name: String,
    phone: Number.withConstraint(n => n.toString().length === 9),
    iban: String,
    kms: Number,
    discord: Union(Number, String),
    steam: Optional(String),
});
export type CreateOfficerRequestBody = Static<typeof CreateOfficerRequestBody>;

export const UpdateOfficerRequestBody = Partial({
    name: String,
    patent: Number,
    callsign: String,
    status: Number,
    entry_date: Number,
    promotion_date: Number,
    phone: Number,
    iban: String,
    kms: Number,
    discord: Union(Number, String),
    steam: String,
    special_units: Array(Record({
        id: Number,
        role: Number
    }))
});
export type UpdateOfficerRequestBody = Static<typeof UpdateOfficerRequestBody>;

export const DeleteOfficerRequestBody = Record({
   reason: Optional(String)
});
export type DeleteOfficerRequestBody = Static<typeof DeleteOfficerRequestBody>;