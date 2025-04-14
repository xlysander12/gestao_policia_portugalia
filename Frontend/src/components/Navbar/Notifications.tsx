import NotificationsIcon from '@mui/icons-material/Notifications';
import {Badge, Divider, IconButton, Menu, MenuItem} from "@mui/material";
import {useCallback, useContext, useEffect, useState} from "react";
import {make_request, RequestMethod} from "../../utils/requests.ts";
import {toast} from "react-toastify";
import {
    ActivityNotification,
    BaseNotification,
    UtilNotificationsResponse
} from '@portalseguranca/api-types/util/output';
import {useNavigate} from "react-router-dom";
import {useForceData, usePrevious, useWebSocketEvent} from "../../hooks";
import {LoggedUserContext} from '../PrivateRoute/logged-user-context.ts';
import useSound from "use-sound";
import notification_sound1 from "../../assets/notification_sound1.mp3"
import Gate from "../Gate/gate.tsx";
import {DefaultTypography} from "../DefaultComponents";
import {getObjectFromId} from "../../forces-data-context.ts";
import moment from "moment";
import {OfficerData, OfficerInfoGetResponse} from '@portalseguranca/api-types/officers/output';
import { SOCKET_EVENT } from '@portalseguranca/api-types';

type InnerActivityNotification = Omit<ActivityNotification, "officer"> & {
    officer: OfficerData
}

function isActivityNotification(notification: BaseNotification): notification is ActivityNotification {
    return notification.type === "activity";
}

function isInnerActivityNotification(notification: BaseNotification): notification is InnerActivityNotification {
    return notification.type === "activity";
}

function Notifications() {
    // Hook to navigate to the URL of the notification
    const navigate = useNavigate();

    // Get the data of the logged user from context
    const loggedUser = useContext(LoggedUserContext);

    // Hook to get the force's data
    const [forceData] = useForceData();

    // Hook and state that handles the notification sound
    const [playSound] = useSound(notification_sound1);
    const [firstRender, setFirstRender] = useState<boolean>(true);

    // State that holds all notifications and if the component needs to refreshed
    const [notifications, setNotifications] = useState<BaseNotification[]>([]);
    const [needsRefresh, setNeedsRefresh] = useState<boolean>(true);

    // Hook to hold the previous notifications
    const previousNotifications = usePrevious(notifications);

    // State that holds the status of the Menu
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

    async function updateNotifications() {
        // Fecth notifications from backend
        const response = await make_request("/util/notifications", RequestMethod.GET);
        const responseJson: UtilNotificationsResponse = await response.json();

        // If the response isn't successful, return
        if (!response.ok) {
            toast.error(responseJson.message);
        }

        const notifications = responseJson.data;

        // Loop through the notifications and get the officer data if it is required
        for (const notification of notifications) {
            if (isActivityNotification(notification)) {
                const officerResponse = await make_request(`/officers/${notification.officer}`, RequestMethod.GET);
                const officerResponseJson = await officerResponse.json() as OfficerInfoGetResponse;

                if (!officerResponse.ok) {
                    toast.error(officerResponseJson.message);
                    continue;
                }

                // @ts-expect-error - This is done this way so all the officer data can be stored in the object for reference
                notification.officer = officerResponseJson.data as OfficerData;
            }
        }

        // Check if any of the notifications are new
        // Since notifications are objects, we can't compare them directly
        if (!firstRender && previousNotifications !== undefined) {
            const newNotifications = notifications.filter(notification => {
                return !previousNotifications.some(previousNotification => {
                    return JSON.stringify(previousNotification) === JSON.stringify(notification);
                });
            });

            if (newNotifications.length > 0) {
                playSound();
                toast.info("Nova notificação!");
            }
        }

        // Set notifications
        setNotifications(notifications);

        // Set the needsRefresh state to false
        setNeedsRefresh(false);

        // Set the firstRender state to false
        setFirstRender(false);
    }

    function closeMenu() {
        setMenuOpen(false);
        setMenuAnchor(null);
    }

    useWebSocketEvent(SOCKET_EVENT.ACTIVITY, useCallback(() => {
        if (loggedUser.intents["activity"]) {
            setNeedsRefresh(true);
        }
    }, [loggedUser.intents["activity"]]));

    useEffect(() => {
        if (needsRefresh) {
            void updateNotifications();
        }
    }, [needsRefresh]);

    return (
        <>
            <Badge
                badgeContent={notifications.length}
                color={"primary"}
                overlap={"circular"}
            >
                <IconButton
                    onClick={(event) => {
                        setMenuOpen(true);
                        setMenuAnchor(event.currentTarget);
                    }}
                >

                    <NotificationsIcon
                        sx={{
                            color: "white"
                        }}
                    />
                </IconButton>
            </Badge>

            <Menu
                open={menuOpen}
                onClose={closeMenu}
                anchorEl={menuAnchor}
            >
                {notifications.map((notification: BaseNotification, index) => {
                    if (isInnerActivityNotification(notification)) {
                        return (
                            <div
                                key={`notification-${index}`}
                            >
                                <MenuItem
                                    onClick={() => {
                                        navigate(notification.url);
                                        closeMenu();
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "5px"
                                        }}
                                    >
                                        <DefaultTypography>Pedido de {getObjectFromId(notification.justificationType, forceData.inactivity_types)!.name} Pendente</DefaultTypography>
                                        <DefaultTypography color={"gray"} fontSize={"small"}>{moment(notification.timestamp).calendar()}</DefaultTypography>
                                        <DefaultTypography color={"gray"}>{getObjectFromId(notification.officer.patent, forceData.patents)!.name} {notification.officer.name}</DefaultTypography>
                                    </div>
                                </MenuItem>

                                <Gate show={index !== notifications.length - 1}>
                                    <Divider variant={"middle"} sx={{borderColor: "var(--portalseguranca-color-background-light)"}}/>
                                </Gate>
                            </div>
                        );
                    }
                })}

                <Gate show={notifications.length === 0}>
                    <MenuItem
                        disabled
                    >
                        Não existem notificações
                    </MenuItem>
                </Gate>
            </Menu>
        </>
    );
}

export default Notifications;