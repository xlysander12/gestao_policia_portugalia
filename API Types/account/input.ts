import {Record, Number, String, Boolean, Static, Optional} from "runtypes";

export const LoginRequestBody = Record({
    nif: Number,
    password: String,
    persistent: Optional(Boolean)
});

export type LoginRequestBodyType = Static<typeof LoginRequestBody>

export const ChangePasswordRequestBody = Record({
    oldPassword: String,
    newPassword: String,
    confirmPassword: String
});

export type ChangePasswordRequestBodyType = Static<typeof ChangePasswordRequestBody>
