import {useContext, useEffect} from "react";
import {WebsocketContext} from "../components/PrivateRoute/websocket-context.ts";
import { SocketResponse } from "@portalseguranca/api-types";

function useWebSocketEvent<DataType extends SocketResponse>(event_name: string, callback: (data: DataType) => void): boolean {
    // Get the socket from context
    const socket = useContext(WebsocketContext);

    useEffect(() => {
        // If the socket doesn't exist, return
        if (!socket || !socket.connected) return;

        // Apply the callback to the event
        socket.on(event_name, callback);

        return () => {
            if (socket) {
                socket.off(event_name, callback);
            }
        }
    }, [socket, event_name, callback]);


    return !!socket?.connected;
}

export default useWebSocketEvent;