import {Record, Number, String, Boolean, Static, Optional, Array} from "runtypes";

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


export const ValidateTokenRequestBody = Record({
    intents: Optional(Array(String))
});
export type ValidateTokenRequestBodyType = Static<typeof ValidateTokenRequestBody>
