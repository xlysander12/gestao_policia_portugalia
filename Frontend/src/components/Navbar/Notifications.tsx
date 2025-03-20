import NotificationsIcon from '@mui/icons-material/Notifications';
import {Badge, IconButton, Menu, MenuItem} from "@mui/material";
import {useCallback, useContext, useEffect, useState} from "react";
import {make_request, RequestMethod} from "../../utils/requests.ts";
import {toast} from "react-toastify";
import {BaseNotification, UtilNotificationsResponse} from '@portalseguranca/api-types/util/output';
import {useNavigate} from "react-router-dom";
import {usePrevious, useWebSocketEvent} from "../../hooks";
import { LoggedUserContext } from '../PrivateRoute/logged-user-context.ts';
import useSound from "use-sound";
import notification_sound1 from "../../assets/notification_sound1.mp3"
import Gate from "../Gate/gate.tsx";

function Notifications() {
    // Hook to navigate to the URL of the notification
    const navigate = useNavigate();

    // Get the data of the logged user from context
    const loggedUser = useContext(LoggedUserContext);

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

        // Check if any of the notifications are new
        if (!firstRender && previousNotifications !== undefined) {
            const newNotifications = notifications.filter((notification: BaseNotification) => {
                return !previousNotifications.includes(notification);
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

    useWebSocketEvent("activity", useCallback(() => {
        if (loggedUser.intents["activity"]) {
            setNeedsRefresh(true);
        }
    }, [loggedUser.intents["activity"]]));

    useEffect(() => {
        if (needsRefresh) {
            updateNotifications();
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
                onClose={() => {
                    setMenuOpen(false);
                    setMenuAnchor(null);
                }}
                anchorEl={menuAnchor}
            >
                {notifications.map((notification: BaseNotification, index) => (
                    <MenuItem
                        key={`notification-${index}`}
                        onClick={() => {
                            navigate(notification.url);
                        }}
                    >
                        {notification.text}
                    </MenuItem>
                ))}

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