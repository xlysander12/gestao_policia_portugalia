import {BaseResponse, SocketResponse} from "../index";

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

export interface ExistingAnnouncementSocket extends SocketResponse {
    id: number
    force: string
}

export interface AnnouncementAddSocket extends SocketResponse {
    action: "add"
}

export interface AnnouncementUpdateSocket extends ExistingAnnouncementSocket {
    action: "update"
}

export interface AnnouncementDeleteSocket extends ExistingAnnouncementSocket {
    action: "delete"
}