import {useContext, useEffect} from "react";
import {WebsocketContext} from "../components/PrivateRoute/websocket-context.ts";
import {SOCKET_EVENT, SocketResponse} from "@portalseguranca/api-types";
import { Socket } from "socket.io-client";

function useWebSocketEvent<DataType extends SocketResponse>(event_name: SOCKET_EVENT, callback: (data: DataType) => void, customSocket?: Socket | null): boolean {
    // Get the socket from context
    const socket = useContext(WebsocketContext);

    useEffect(() => {
        // If the socket doesn't exist and no custom Socket was passed, return
        if ((!socket || !socket.connected) && (!customSocket || !customSocket.connected)) return;

        // Getting the will-be-used socket
        const usingSocket = customSocket || socket;

        // Apply the callback to the event
        usingSocket!.on(event_name, callback);

        return () => {
            if (socket) {
                usingSocket!.off(event_name, callback);
            }
        }
    }, [socket, event_name, callback]);


    return !!socket?.connected;
}

export default useWebSocketEvent;