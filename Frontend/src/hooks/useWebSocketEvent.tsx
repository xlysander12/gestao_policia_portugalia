import {useCallback, useContext, useEffect} from "react";
import {WebsocketContext} from "../components/PrivateRoute/websocket-context.ts";
import { SocketResponse } from "@portalseguranca/api-types";

function useWebSocketEvent<DataType extends SocketResponse>(event_name: string, callback: (data: DataType) => void): boolean {
    // Get the socket from context
    const socket = useContext(WebsocketContext);

    // Create a stable callback function
    const stableCallback = useCallback(callback, []);

    useEffect(() => {
        // If the socket doesn't exist, return
        if (!socket || !socket.connected) return;

        // Apply the callback to the event
        socket.on(event_name, stableCallback);

        return () => {
            if (socket) {
                socket.off(event_name, stableCallback);
            }
        }
    }, [socket, event_name, stableCallback]);


    return !!socket?.connected;
}

export default useWebSocketEvent;