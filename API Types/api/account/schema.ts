import {RequestSuccess} from "../schema";

export interface ValidateTokenPostResponse extends RequestSuccess {
    data: number;
}