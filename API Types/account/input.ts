import {Record, Number, String, Boolean, Static, Optional, Array, Dictionary} from "runtypes";

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

export const ChangeAccountInfoRequestBody = Record({
   suspended: Optional(Boolean),
   intents: Optional(Dictionary(Boolean, String))
});
export type ChangeAccountInfoRequestBodyType = Static<typeof ChangeAccountInfoRequestBody>


export const ValidateTokenRequestBody = Record({
    intents: Optional(Array(String))
});
export type ValidateTokenRequestBodyType = Static<typeof ValidateTokenRequestBody>
