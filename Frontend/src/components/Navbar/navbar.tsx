import {useContext, useEffect, useState} from "react";
import style from "./navbar.module.css";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {BASE_URL} from "../../utils/constants";
import {LoggedUserContext} from "../PrivateRoute/logged-user-context.ts";
import {getObjectFromId} from "../../forces-data-context.ts";
import ScreenSplit from "../ScreenSplit/screen-split.tsx";
import Gate from "../Gate/gate.tsx";
import {Divider, Menu, MenuItem, Select, styled} from "@mui/material";
import {make_request} from "../../utils/requests.ts";
import {toast} from "react-toastify";
import {BaseResponse, SocketResponse} from "@portalseguranca/api-types/index.ts";
import {ConfirmationDialog} from "../Modal";
import ChangePasswordModal from "./modals/change-password.tsx";
import FeedbackModal from "./modals/feedback.tsx";
import {useForceData, useWebSocketEvent} from "../../hooks";
import {DefaultTypography} from "../DefaultComponents";
import {
    ExistingPatrolSocket,
    PatrolData,
    PatrolInfoResponse
} from "@portalseguranca/api-types/patrols/output";

type SubPathProps = {
    path?: string,
    name: string,
    only?: boolean
}
const SubPath = ({path, name, only}: SubPathProps) => {
    // useLocation
    const location = useLocation();

    // Not a redirect
    if (path === undefined || path === "") {
        return (
            <div className={style.subPathDiv}>
                <p className={style.navbarSubPathText}>{name}</p>
            </div>
        );
    }

    return (
        <>
            <div className={style.subPathDiv}>
                <Link className={`${style.navbarSubPathText} ${style.navbarRedirect}`} to={path}
                      reloadDocument={location.pathname === "/login"}>{name}</Link>
            </div>
            <div className={style.subPathDiv}>
                <p className={style.navbarSubPathText}>{only ? "" : "»"}</p>
            </div>
        </>
    );
}

const ForceSelectStyle = styled(Select)(() => ({
    // Remove the border
    "& .MuiOutlinedInput-notchedOutline": {
        border: 0
    },

    // Apply the same color as the text at the icon
    "& .MuiSelect-icon": {
        color: "white"
    },

    // Apply same color and font size as the other text in the navbar
    "& .MuiOutlinedInput-input": {
        WebkitTextFillColor: "white"
    },
    fontSize: "20px",

    // Darken background when hovering
    "&:hover": {
        backgroundColor: "var(--portalseguranca-color-hover-dark)"
    }
}))

type NavbarProps = {
    isLoginPage: boolean
    handleForceChange: (newForce: string) => void
}
function Navbar({isLoginPage, handleForceChange}: NavbarProps) {
    // Get the patents of the force where the user is logged in from context
    const [forceData] = useForceData();

    // Get the logged user's info from context
    const loggedUser = useContext(LoggedUserContext);

    // Set other useful hooks
    const location = useLocation();
    const navigate = useNavigate();

    // Set the state that holds if the account menu is open
    const [accountMenuOpen, setAccountMenuOpen] = useState<boolean>(false);
    const [accountMenuAnchor, setAccountMenuAnchor] = useState<null | HTMLElement>(null);

    // Set the state of the confirmation dialog for the logout
    const [isLogoutOpen, setLogoutOpen] = useState<boolean>(false);

    // Set the state of the change password modal
    const [isChangePasswordOpen, setChangePasswordOpen] = useState<boolean>(false);

    // Set the state of the feedback modal
    const [isFeedbackOpen, setFeedbackOpen] = useState<{open: boolean, type: "error" | "suggestion"}>({open: false, type: "error"});

    // Set the state with the status of the officer
    const [officerPatrol, setOfficerPatrol] = useState<PatrolData | null>(null);

    // Set the full name of the officer
    const fullName = isLoginPage ? "":
        `${getObjectFromId(loggedUser.info.professional.patent, forceData.patents)!.name} ${loggedUser.info.personal.name}`;

    const status = {
        color: officerPatrol ? "lightBlue": getObjectFromId(loggedUser.info.professional.status, forceData.statuses)!.color,
        name: officerPatrol ? "Em Patrulha": getObjectFromId(loggedUser.info.professional.status, forceData.statuses)!.name
    }

    // Create the array of elements for the pathsdiv
    const paths = [];

    // Get the current path minus the base url
    const currentPath = location.pathname.replace(`${BASE_URL}`, "").replace("/", "").split("/")[0];

    // First thing that needs to be done is to add the main title to the navbar
    paths.push(<SubPath key={"navbarMainPath"} path={"/"} name={"Portal Segurança"} only={currentPath === ""}/>);

    // If we're in a path different than the main one, add the main path to the paths array
    if (currentPath !== "") {
        paths.push(<SubPath key={`navbarPath${currentPath}`} name={currentPath[0].toUpperCase() + currentPath.slice(1)}/>);
    }

    async function getOfficerPatrol(): Promise<PatrolData | null> {
        // Make request to the backend to check if the officer is on patrol
        const response = await make_request(`/officers/${loggedUser.info.personal.nif}/patrol`, "GET");

        const responseJson: PatrolInfoResponse = await response.json();

        // If the response is 404, the officer is not on patrol
        if (response.status === 404) {
            return null;
        }

        // If the response is not ok, show a toast with the error
        if (!response.ok) {
            toast(responseJson.message, {type: "error"});
            return null;
        }

        return responseJson.data;
    }

    async function logout() {
        // Call the logout endpoint
        const response = await make_request(`/accounts/logout`, "POST");
        const responseJson: BaseResponse = await response.json();

        // If the response is not ok, show a toast with the error
        if (!response.ok) {
            toast(responseJson.message, {type: "error"});
            return;
        }

        // Since the request was successful, the cookie with the session token has already been deleted
        // Delete the force from the local storage
        localStorage.removeItem("force");

        // Redirect to the login page
        navigate("/login");
    }

    // Whenever an event with the name "patrols" is received, run the callback to ensure the information is up to date
    useWebSocketEvent("patrols", async (data: SocketResponse) => {
        // If a patrol is added, check if the logged user is in any patrol
        if (data.action === "add") {
            setOfficerPatrol(await getOfficerPatrol());
        }

        const existingPatrol = data as ExistingPatrolSocket;
        const patrolFullId = `${existingPatrol.force}${existingPatrol.id}`;

        // If a patrol is deleted, check if it is the one the logged user is in
        if (data.action === "delete") {
            if (officerPatrol !== null && officerPatrol.id === patrolFullId) {
                setOfficerPatrol(null);
            }
        }

        // If a patrol is updated, make sure the logged user hasn't been removed, or the patrol has ended
        if (data.action === "update") {
            if (officerPatrol !== null && officerPatrol.id === patrolFullId) {
                setOfficerPatrol(await getOfficerPatrol());
            }
        }
    });

    useEffect(() => {
        const exec = async () => {
            setOfficerPatrol(await getOfficerPatrol());
        }

        exec();
    }, []);

    return (
        <>
            <div className={style.mainNavbar}>

                <ScreenSplit leftSideComponent={(
                    <div className={style.leftSide}>
                        {/*Add the div that will hold the paths*/}
                        <div className={style.pathsDiv}>
                            {paths}
                        </div>

                        <Gate show={!isLoginPage}>
                            <div className={style.navButtonsDiv}>
                                <Link to={"/efetivos"} className={style.navButton}>Efetivos</Link>
                                <Link to={"/patrulhas"} className={style.navButton}>Patrulhas</Link>
                                <Link to={"/atividade"} className={style.navButton}>Atividade</Link>
                                <Link to={"/"} className={style.navButton}>Avaliações</Link>
                            </div>
                        </Gate>
                    </div>
                )} leftSidePercentage={65}>
                    {/*Div that holds the user info and force selector*/}
                    <Gate show={!isLoginPage}>
                        <div className={style.rightSide}>
                            <div className={style.userInfoDiv} onClick={(event) => {
                                setAccountMenuOpen(true);
                                setAccountMenuAnchor(event.currentTarget);
                            }}>
                                <DefaultTypography fontSize={"20px"}>{fullName}</DefaultTypography>
                                <DefaultTypography
                                    fontSize={"smaller"}
                                    color={status.color}
                                >
                                    {status.name}
                                </DefaultTypography>
                            </div>

                            <ForceSelectStyle
                                value={localStorage.getItem("force")}
                                onChange={(event) => {
                                    handleForceChange(event.target.value as string);
                                }}
                            >
                                {loggedUser.forces.map((force) => {
                                    return (
                                        <MenuItem key={`userforcenavbar${force.name}`} value={force.name} disabled={force.suspended}>{force.name.toUpperCase()}</MenuItem>
                                    )
                                })}
                            </ForceSelectStyle>
                        </div>
                    </Gate>
                </ScreenSplit>
            </div>


            <Menu
                open={accountMenuOpen}
                anchorEl={accountMenuAnchor}
                anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                transformOrigin={{vertical: "top", horizontal: "right"}}
                onClose={() => {
                    setAccountMenuOpen(false);
                    setAccountMenuAnchor(null);
                }}
            >
                <MenuItem>Atualizar Data Última Cerimónia</MenuItem>

                <Divider/>

                <MenuItem
                    onClick={() => {
                        setAccountMenuOpen(false);
                        setFeedbackOpen({open: true, type: "error"})
                    }}
                >
                    Reportar Problema
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        setAccountMenuOpen(false);
                        setFeedbackOpen({open: true, type: "suggestion"});
                    }}
                >
                    Fazer Sugestão
                </MenuItem>

                <Divider/>

                <MenuItem
                    onClick={() => {setAccountMenuOpen(false); setChangePasswordOpen(true)}}
                >
                    Alterar Palavra-Passe
                </MenuItem>

                <MenuItem
                    onClick={() => {setAccountMenuOpen(false); setLogoutOpen(true)}}
                >
                    Terminar Sessão
                </MenuItem>
            </Menu>

            <ChangePasswordModal open={isChangePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
            <ConfirmationDialog open={isLogoutOpen} title={"Terminar Sessão"} text={"Tens a certeza que queres terminar a sessão?"} onConfirm={logout} onDeny={() => setLogoutOpen(false)}/>

            <FeedbackModal type={isFeedbackOpen.type} open={isFeedbackOpen.open} onClose={() => setFeedbackOpen({open: false, type: "error"})} />
        </>
    );
}

export default Navbar;