import {createContext} from "react";
import {Socket} from "socket.io-client";

export const WebsocketContext = createContext<Socket | null>(null);