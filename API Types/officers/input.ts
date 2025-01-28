import {Array, Number, Optional, Partial, Record, Static, String} from "runtypes";

export const ListOfficersQueryParams = Partial({
   search: String
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
    discord: Number,
    steam: String,
});
export type CreateOfficerRequestBody = Static<typeof CreateOfficerRequestBody>;

export const UpdateOfficerRequestBody = Record({
    name: Optional(String),
    patent: Optional(Number),
    callsign: Optional(String),
    status: Optional(Number),
    entry_date: Optional(String),
    phone: Optional(Number),
    iban: Optional(String),
    kms: Optional(Number),
    discord: Optional(Number),
    steam: Optional(String),
    special_units: Optional(Array(Record({
        id: Number,
        role: Number
    })))
});
export type UpdateOfficerRequestBody = Static<typeof UpdateOfficerRequestBody>;

export const DeleteOfficerRequestBody = Record({
   reason: Optional(String)
});
export type DeleteOfficerRequestBody = Static<typeof DeleteOfficerRequestBody>;