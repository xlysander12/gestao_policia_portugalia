import {useContext, useEffect, useState} from "react";
import style from "./navbar.module.css";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {BASE_URL} from "../../utils/constants";
import {LoggedUserContext} from "../PrivateRoute/logged-user-context.ts";
import ScreenSplit from "../ScreenSplit/screen-split.tsx";
import Gate from "../Gate/gate.tsx";
import {Divider, Menu, MenuItem, Select, styled} from "@mui/material";
import {make_request} from "../../utils/requests.ts";
import {toast} from "react-toastify";
import {BaseResponse, SOCKET_EVENT, SocketResponse} from "@portalseguranca/api-types/index.ts";
import {ConfirmationDialog} from "../Modal";
import ChangePasswordModal from "./modals/change-password.tsx";
import FeedbackModal from "./modals/feedback.tsx";
import {useWebSocketEvent} from "../../hooks";
import {DefaultTypography} from "../DefaultComponents";
import {ExistingPatrolSocket, PatrolData, PatrolInfoResponse} from "@portalseguranca/api-types/patrols/output";
import Notifications from "./Notifications.tsx";
import packageJson from "../../../package.json";
import LastCeremonyModal from "./modals/LastCeremonyModal.tsx";

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

    // Modal states
    const [isChangePasswordOpen, setChangePasswordOpen] = useState<boolean>(false);
    const [isFeedbackOpen, setFeedbackOpen] = useState<{open: boolean, type: "error" | "suggestion"}>({open: false, type: "error"});
    const [isLastCeremonyOpen, setLastCeremonyOpen] = useState<boolean>(false);

    // Set the state with the status of the officer
    const [officerPatrol, setOfficerPatrol] = useState<PatrolData | null>(null);

    // Set the full name of the officer
    const fullName = isLoginPage ? "":
        `${loggedUser.info.professional.patent.name} ${loggedUser.info.personal.name}`;

    const status = {
        color: officerPatrol ? "lightBlue": loggedUser.info.professional.status.color,
        name: officerPatrol ? "Em Patrulha": loggedUser.info.professional.status.name
    }

    // Create the array of elements for the pathsdiv
    const paths = [];

    // Get the current path minus the base url
    const currentPath = location.pathname.replace(`${BASE_URL}`, "").replace("/", "").split("/")[0];

    // First thing that needs to be done is to add the main title to the navbar
    paths.push(<SubPath key={"navbarMainPath"} path={"/"} name={"Portal Segurança"} only={currentPath === "" || currentPath === "e"}/>);

    // If we're in a path different than the main one, add the main path to the paths array
    if (currentPath !== "" && currentPath !== "e") {
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
    useWebSocketEvent(SOCKET_EVENT.PATROLS, async (data: SocketResponse) => {
        // If a patrol is added, check if the logged user is in any patrol
        if (data.action === "add" || data.action === "update") {
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
    });

    useEffect(() => {
        const exec = async () => {
            setOfficerPatrol(await getOfficerPatrol());
        }

        if (!isLoginPage) {
            void exec();
        }
    }, [isLoginPage]);

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
                                <Gate show={loggedUser.info.professional.patent.max_evaluation > 0}>
                                    <Link to={"/avaliacoes"} className={style.navButton}>Avaliações</Link>
                                </Gate>
                            </div>
                        </Gate>
                    </div>
                )} leftSidePercentage={"fit-content"}>
                    {/*Div that holds the user info and force selector*/}
                    <Gate show={!isLoginPage}>
                        <div className={style.rightSide}>
                            <div className={style.userInfoDiv} onClick={(event) => {
                                setAccountMenuOpen(true);
                                setAccountMenuAnchor(event.currentTarget);
                            }}>
                                <DefaultTypography fontSize={"18px"} color={"white"}>{fullName}</DefaultTypography>
                                <DefaultTypography
                                    fontSize={"smaller"}
                                    color={status.color}
                                >
                                    {status.name}
                                </DefaultTypography>
                            </div>

                            <Notifications />

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
                <Gate show={loggedUser.intents.evaluations}>
                    <MenuItem
                        onClick={() => {
                            setAccountMenuOpen(false);
                            setLastCeremonyOpen(true);
                        }}
                    >
                        Atualizar Data Última Cerimónia
                    </MenuItem>

                    <Divider/>
                </Gate>

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

                <Divider/>


                <div
                    style={{padding: "6px 16px", opacity: "0.38"}}
                >
                    <DefaultTypography
                        aria-disabled={false}
                        clickable
                        fontSize={"x-small"}
                        color={"lightgray"}
                        clickableColorHover={"white"}
                        onClick={() => {
                            window.open("https://github.com/xlysander12/gestao_policia_portugalia", "_blank"
                            )}
                        }>
                        v{packageJson.version}
                    </DefaultTypography>
                </div>
            </Menu>

            <LastCeremonyModal open={isLastCeremonyOpen} onClose={() => setLastCeremonyOpen(false)} />

            <ChangePasswordModal open={isChangePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
            <ConfirmationDialog open={isLogoutOpen} title={"Terminar Sessão"} text={"Tens a certeza que queres terminar a sessão?"} onConfirm={logout} onDeny={() => setLogoutOpen(false)}/>

            <FeedbackModal type={isFeedbackOpen.type} open={isFeedbackOpen.open} onClose={() => setFeedbackOpen({open: false, type: "error"})} />
        </>
    );
}

export default Navbar;