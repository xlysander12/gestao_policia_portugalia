import {useContext, useState} from "react";
import style from "./navbar.module.css";
import {Link, useLocation} from "react-router-dom";
import {BASE_URL} from "../../utils/constants";
import {LoggedUserContext} from "../PrivateRoute/logged-user-context.ts";
import {ForceDataContext, ForceDataContextType, getObjectFromId} from "../../force-data-context";
import ScreenSplit from "../ScreenSplit/screen-split.tsx";
import Gate from "../Gate/gate.tsx";
import {Divider, Menu, MenuItem, Select, styled} from "@mui/material";

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
    const forcePatents = useContext<ForceDataContextType>(ForceDataContext).patents;

    // Get the logged user's info from context
    const loggedUser = useContext(LoggedUserContext);

    // Set other useful hooks
    const location = useLocation();

    // Set the state that holds if the account menu is open
    const [accountMenuOpen, setAccountMenuOpen] = useState<boolean>(false);
    const [accountMenuAnchor, setAccountMenuAnchor] = useState<null | HTMLElement>(null);

    // Set the full name of the officer
    let fullName = "";
    if (!isLoginPage) {
        fullName = `${getObjectFromId(loggedUser.info.professional.patent, forcePatents)!.name} ${loggedUser.info.personal.name}`;
    }

    // Create the array of elements for the pathsdiv
    let paths = [];

    // Get the current path minus the base url
    let currentPath = location.pathname.replace(`${BASE_URL}`, "").replace("/", "").split("/")[0];

    // First thing that needs to be done is to add the main title to the navbar
    paths.push(<SubPath key={"navbarMainPath"} path={"/"} name={"Portal Segurança"} only={currentPath === ""}/>);

    // If we're in a path different than the main one, add the main path to the paths array
    if (currentPath !== "") {
        paths.push(<SubPath key={`navbarPath${currentPath}`} name={currentPath[0].toUpperCase() + currentPath.slice(1)}/>);
    }

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
                                <Link to={"/atividade"} className={style.navButton}>Atividade</Link>
                                <Link to={"/"} className={style.navButton}>Avaliações</Link>
                                <Link to={"/"} className={style.navButton}>Patrulhas</Link>
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
                                <p className={style.officerName}>{fullName}</p>
                            </div>

                            <ForceSelectStyle
                                value={localStorage.getItem("force")}
                                onChange={(event) => {
                                    handleForceChange(event.target.value as string);
                                }}
                            >
                                {loggedUser.forces.map((force, i) => {
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
                <MenuItem>Reportar Problema</MenuItem>
                <MenuItem>Fazer Sugestão</MenuItem>
                <Divider/>
                <MenuItem>Alterar Palavra-Passe</MenuItem>
                <MenuItem>Terminar Sessão</MenuItem>
            </Menu>
        </>
    );
}

export default Navbar;