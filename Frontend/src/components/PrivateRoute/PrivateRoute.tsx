import {ReactElement, useCallback, useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {LoggedUserContext} from "./logged-user-context.ts";
import {Topbar} from "../Topbar";
import {AccountSocket} from "@portalseguranca/api-types/account/output";
import {Loader} from "../Loader";
import {toast} from "react-toastify";
import {OfficerData, OfficerSocket} from "@portalseguranca/api-types/officers/output";
import {io, Socket} from "socket.io-client";
import {WebsocketContext} from "./websocket-context.ts";
import {useForceData, useWebSocketEvent} from "../../hooks";
import moment from "moment";
import {MODULE} from "@portalseguranca/api-types";
import { OfficerActivitySocket } from "@portalseguranca/api-types/officers/activity/output";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {getObjectFromId} from "../../utils/misc.ts";
import {getAccountData, getAccountForces, validateSession} from "@api/accounts";
import {getOfficerData} from "@api/officers";

type PrivateRouteProps = {
    element: ReactElement
    handleForceChange: (newForce: string) => void
}

function PrivateRoute({element, handleForceChange}: PrivateRouteProps) {
    const queryClient = useQueryClient();

    // Initialize state
    const [socket, setSocket] = useState<Socket | null>(null);

    // Initialize navigate and location hooks
    const navigate = useNavigate();
    const location = useLocation();

    // Get the force's data from Context
    const [forceData] = useForceData();

    const redirectLogin = useCallback(() => {
        if (location.pathname === "/") {
            void navigate("/login");
        } else {
            void navigate("/login?redirect=" + location.pathname);
        }
    }, [location.pathname, navigate]);

    // Query to check the validity of the token
    const tokenValidation = useQuery({
        queryKey: validateSession().queryKeys,
        queryFn: validateSession().queryfn,
        refetchInterval: 60000, // Refetch every 60 seconds to keep the session alive and check for expiration
        retry: false
    });


    // Query to fetch the logged user's information, which depends on the token being valid (nif being set)
    const userInfoQuery = useQuery({
        queryKey: getOfficerData(tokenValidation.data?.data ?? 0).queryKeys,
        queryFn: getOfficerData(tokenValidation.data?.data ?? 0).queryfn,
        enabled: !tokenValidation.error || !tokenValidation.isLoading

    });

    const accountDataQuery = useQuery({
        queryKey: getAccountData(tokenValidation.data?.data ?? 0).queryKeys,
        queryFn: getAccountData(tokenValidation.data?.data ?? 0).queryfn,
        enabled: !tokenValidation.error || !tokenValidation.isLoading
    });

    const accountForcesQuery = useQuery({
        queryKey: getAccountForces(tokenValidation.data?.data ?? 0).queryKeys,
        queryFn: getAccountForces(tokenValidation.data?.data ?? 0).queryfn,
        enabled: !tokenValidation.error || !tokenValidation.isLoading
    });

    // Add the Socket Event listener for the logged user's data
    useWebSocketEvent<OfficerSocket>(MODULE.OFFICERS, useCallback(data => {
        if (data.nif === tokenValidation.data?.data || data.nif === 0) { // If nif is 0, all users were affected
            void queryClient.invalidateQueries({
                queryKey: getOfficerData(tokenValidation.data?.data ?? 0).queryKeys
            });
        }
    }, [tokenValidation.data, queryClient]), socket);

    useWebSocketEvent<OfficerActivitySocket>(MODULE.ACTIVITY, useCallback(data => {
        if (data.type !== "justification") return;

        if (data.nif !== tokenValidation.data?.data) return;

        if (data.action === "add") return;

        void queryClient.invalidateQueries({
            queryKey: getOfficerData(tokenValidation.data?.data).queryKeys
        });
    }, [tokenValidation.data, queryClient]), socket);

    useWebSocketEvent<AccountSocket>(MODULE.ACCOUNTS, useCallback((data) => {
        if (data.nif !== tokenValidation.data?.data) return;

        void queryClient.invalidateQueries({
            queryKey: getOfficerData(tokenValidation.data?.data).queryKeys
        });
    }, [tokenValidation.data, queryClient]), socket);

    // Create the websocket connection when not in the login page
    useEffect(() => {
        // Create socket
        const newSocket = io({
            path: "/portugalia/portalseguranca/ws",
            transports: ["websocket"],
            autoConnect: true,
            
            // Reconnection/backoff options
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 100,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5,
            auth: {
                force: localStorage.getItem("force")
            },
            withCredentials: true
        });

        // Attempt to connect after validating the session/token
        const tryConnect = () => {
            if (!newSocket) return;

            try {
                // Connect (socket.io will perform reconnection attempts automatically if needed)
                newSocket.connect();
            } catch (err) {
                // Silent - will rely on reconnect/backoff and visibility/online triggers
                console.warn("Websocket tryConnect error: ", err);
            }
        };

        // Handlers
        const onConnect = () => {
            // Publish the socket object to state so other hooks/components can use it
            setSocket(newSocket);
        };

        const onConnectError = (err: any) => {
            console.warn("Socket connect_error: ", err);
            // otherwise the socket's reconnection/backoff will handle retries
        };

        const onDisconnect = (reason: string) => {
            // Keep socket object in state (so context consumers see it), but it's disconnected
            console.info("Socket disconnected: ", reason);
        };

        const onReconnectAttempt = (attempt: number) => {
            // Log attempt number
            console.info("Socket reconnect attempt:", attempt);
        };

        const onReconnectFailed = () => {
            toast("Não foi possível reconectar ao servidor. Verifique a sua ligação.", {type: "error"});
        };

        // Attach handlers
        newSocket.on("connect", onConnect);
        newSocket.on("connect_error", onConnectError);
        newSocket.on("disconnect", onDisconnect);
        // socket.io v4 emits 'reconnect_attempt' or 'reconnect_attempt' depending on version; listen to both common names
        newSocket.on("reconnect_attempt", onReconnectAttempt);
        newSocket.on("reconnect_failed", onReconnectFailed);

        // Visibility / online triggers — try to reconnect when the user returns or regains network
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible" && newSocket && !newSocket.connected) {
                void tryConnect();
            }
        };

        const onOnline = () => {
            if (newSocket && !newSocket.connected) {
                void tryConnect();
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("online", onOnline);

        // Start initial connect attempt
        void tryConnect();

        return () => {
            if (newSocket) {
                try {
                    newSocket.off();
                    newSocket.disconnect();
                } catch (e) {
                    console.warn("Error during socket cleanup:", e);
                }
            }

            if (onVisibilityChange) {
                document.removeEventListener("visibilitychange", onVisibilityChange);
            }

            if (onOnline) {
                window.removeEventListener("online", onOnline);
            }
        }
    }, []);

    // Redirect to login if the token is invalid
    useEffect(() => {
        if (tokenValidation.isError) {
            toast("Sessão inválida. Por favor, faça login novamente.", {type: "error"});
            redirectLogin();
        }
    }, [tokenValidation.isError, redirectLogin]);

    if ([tokenValidation, userInfoQuery, accountForcesQuery, accountDataQuery].some(q => q.isLoading)) {
        return (
            <Loader fullPage/>
        );
    }

    if (tokenValidation.isError) return null;

    return (
        <WebsocketContext.Provider value={socket}>
            <LoggedUserContext.Provider value={{
                info: {
                    personal: {
                        name: userInfoQuery.data!.data.name,
                        nif: userInfoQuery.data!.data.nif,
                        discord: (userInfoQuery.data!.data as OfficerData).discord,
                        steam: (userInfoQuery.data!.data as OfficerData).steam,
                        phone: (userInfoQuery.data!.data as OfficerData).phone,
                        iban: (userInfoQuery.data!.data as OfficerData).iban,
                        kms: (userInfoQuery.data!.data as OfficerData).kms
                    },
                    professional: {
                        patent: getObjectFromId(userInfoQuery.data!.data.patent, forceData.patents)!,
                        callsign: userInfoQuery.data!.data.callsign!,
                        status: getObjectFromId(userInfoQuery.data!.data.status, forceData.statuses)!,
                        entry_date: moment.unix((userInfoQuery.data!.data as OfficerData).entry_date),
                        promotion_date: (userInfoQuery.data!.data as OfficerData).promotion_date !== null ? moment.unix((userInfoQuery.data!.data as OfficerData).promotion_date!): null,
                        special_units: (userInfoQuery.data!.data as OfficerData).special_units.map((unit) => {
                            return {
                                unit: getObjectFromId(unit.id, forceData.special_units)!,
                                role: getObjectFromId(unit.role, forceData.special_unit_roles)!
                            };
                        })
                    }
                },
                forces: accountForcesQuery.data!.data.forces,
                intents: accountDataQuery.data!.data.intents,
                authentication: {
                    password: accountDataQuery.data!.data.password_login,
                    discord: accountDataQuery.data!.data.discord_login
                }
            }}>
                <Topbar handleForceChange={handleForceChange}/>
                <div style={{
                    height: "calc(100vh - calc(4rem + 13px))",
                }}>
                    {element}
                </div>
            </LoggedUserContext.Provider>
        </WebsocketContext.Provider>
    );
}

export default PrivateRoute;
