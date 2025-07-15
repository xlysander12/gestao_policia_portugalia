import {BaseResponse} from "../index";

export interface MinifiedAnnouncement {
    id: string
    author: number
    tags: string[]
    expiration: number | null
    title: string
}

export interface Announcement extends MinifiedAnnouncement {
    forces: string[]
    body: string
}

export interface AnnouncementsListResponse extends BaseResponse {
    meta: {
        pages: number
    }
    data: MinifiedAnnouncement[]
}

export interface AnnouncementInfoResponse extends BaseResponse {
    data: Announcement
}