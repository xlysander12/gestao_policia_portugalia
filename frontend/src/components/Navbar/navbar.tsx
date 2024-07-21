import {useContext, useEffect, useState} from "react";
import style from "./navbar.module.css";
import {Link, useLocation} from "react-router-dom";
import {make_request} from "../../utils/requests";
import {toast} from "react-toastify";
import {BASE_URL, FORCES} from "../../utils/constants";
import {LoggedUserContext} from "../PrivateRoute/logged-user-context.tsx";
import {ForcePatentsContext, getPatentFromId} from "../PrivateRoute/force-patents-context.ts";

type SubPathProps = {
    path?: string,
    name: string,
    only?: boolean
}

const SubPath = ({path, name, only}: SubPathProps) => {
    // Not a redirect
    if (path === undefined || path === "") {
        return (
            <div className={style.subPathDiv}>
                <p className={style.navbarSubPathText}>{name}</p>
            </div>
        );
    }

    return (
        <div className={style.subPathDiv}>
            <Link className={`${style.navbarSubPathText} ${style.navbarRedirect}`} to={path} reloadDocument={true}>{name}</Link>
            <p className={style.navbarSubPathText}>{only ? "": "»"}</p>
        </div>
    );
}

type NavbarProps = {
    isLoginPage: boolean
}
function Navbar({isLoginPage}: NavbarProps) {
    // Get the patents of the force where the user is logged in from context
    const forcePatents = useContext(ForcePatentsContext);

    // Get the logged user's info from context
    const loggedUser = useContext(LoggedUserContext);

    // Set the state of the component
    const [fullName, setFullName] = useState<string>("");

    // Set other useful hooks
    const location = useLocation();

    useEffect(() => {
        const fetchForces = async () => {
            // If we are in the login page, there's nothing to do
            if (isLoginPage) {
                return;
            }

            let forces: any = {
                psp: false,
                gnr: false
            }

            let nif;

            // Making the request to check if the token is valid for all forces
            for (const force of FORCES) {
                const response = await make_request("/account/validateToken", "POST", undefined, force);

                // If the request returned status of 200, the token is valid for that force
                if (response.status === 200) {
                    forces[force] = true;
                }
            }

            // If the user is from atleast one force, get the full name + patent of the user for the selected one
            // TODO: this needs to be changed to the selected force, when the user can select the force
            // @ts-ignore
            setFullName(`${getPatentFromId(loggedUser.info.professional.patent, forcePatents).name} ${loggedUser.info.personal.name}`);
        }

        fetchForces();
    }, []);

    // Create the array of elements for the pathsdiv
    let paths = [];

    // Get the current path minus the base url
    let currentPath = location.pathname.replace(`${BASE_URL}`, "").replace("/", "");

    // First thing that needs to be done is to add the main title to the navbar
    paths.push(<SubPath key={"navbarMainPath"} path={"/"} name={"Portal Segurança"} only={currentPath === ""}/>);

    // If we're in a path different than the main one, add the main path to the paths array
    if (currentPath !== "") {
        paths.push(<SubPath key={`navbarPath${currentPath}`} name={currentPath[0].toUpperCase() + currentPath.slice(1)}/>);
    }

    return (
        <div className={style.mainNavbar}>

            {/*Add the div that will hold the paths*/}
            <div className={style.pathsDiv}>
                {paths}
            </div>

            {/*<Divider flexItem orientation={"vertical"} sx={{*/}
            {/*    margin: "0 0 0 10px",*/}
            {/*    borderColor: "rgba(197, 198, 199)",*/}
            {/*    borderWidth: "2px",*/}
            {/*    borderRadius: "10px"*/}
            {/*}}/>*/}

            <div className={style.navButtonsDiv} style={isLoginPage ? {display: "none"}: {}}>
                <Link to="/efetivos" className={style.navButton} reloadDocument={true}>Efetivos</Link>
                <Link to="/" className={style.navButton} reloadDocument={true}>Atividade</Link>
                <Link to="/" className={style.navButton} reloadDocument={true}>Avaliações</Link>
                <Link to="/" className={style.navButton} reloadDocument={true}>Patrulhas</Link>
            </div>

            {/*TODO: Add a force selector here, floating to the right side of the navbar*/}

            {/*Add the div that will hold the user info*/}
            {/*TODO: Redo this dropdown using MUI Menu*/}
            <div style={{display: `${isLoginPage ? 'none': 'block'}`}} className={style.userInfoDiv}>
                <p className={style.officerName}>{sessionStorage.getItem("navbarFullName") !== null && fullName === "" ? sessionStorage.getItem("navbarFullName"): fullName}</p>
                <div className={style.userInfoDropdown}>
                    <div>
                        <p className={style.userInfoDropdownLink}>Atualizar data última cerimónia</p>
                    </div>

                    {/*Separator*/}
                    <div style={{width: "100%", height: 0, borderBottom: "3px black solid"}}></div>

                    <div>
                        <p className={style.userInfoDropdownLink} onClick={() => {
                            console.log("Reportar problema");
                            toast.error("A funcionalidade de reportar problemas ainda não foi implementada");
                        }}>Reportar problema</p>
                    </div>

                    <div>
                        <p className={style.userInfoDropdownLink}>Colocar sugestão</p>
                    </div>

                    {/*Separator*/}
                    <div style={{width: "100%", height: 0, borderBottom: "3px black solid"}}></div>

                    <div>
                        <p className={style.userInfoDropdownLink}>Alterar palavra-passe</p>
                    </div>

                    <div>
                        <p className={style.userInfoDropdownLink}>Terminar sessão</p>
                    </div>
                </div>
            </div>
        </div>

    );
}

export default Navbar;