import {Component, useEffect, useState} from "react";
import style from "./navbar.module.css";
import {Link, Navigate, useLocation} from "react-router-dom";
import {make_request} from "../../utils/requests";
import {toast} from "react-toastify";
import {base_url} from "../../utils/constants";
import {Divider} from "@mui/material";

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

}

function Navbar() {
    // Set the state of the component
    const [fullName, setFullName] = useState<string>("");

    // Set other useful hooks
    const location = useLocation();

    // Check if we are in the login page
    const isLogin = location.pathname === `${base_url}/login`;

    const buildOfficerName = async (nif: string) => {
        // From the given NIF, get the patent and officer's full name
        let response = await make_request(`/officerInfo/${nif}`, "GET");

        // Mandatory check if the status code was 200
        // This shouldn't ever happen because PrivateRoute should redirect to the login page if the token is invalid, but you never know...
        if (!response.ok) {
            return;
        }

        // From the response, get the patent and officer's full name
        let body = await response.json();

        // Build the officer's full name
        let fullName = `${body.data.patent} ${body.data.name}`;

        // Set the full name of the officer
        setFullName(fullName);

        // Save the full name in the session storage
        sessionStorage.setItem("navbarFullName", fullName);
    }

    useEffect(() => {
        const fetchForces = async () => {
            // If we are in the login page, there's nothing to do
            if (isLogin) {
                return;
            }

            let forces: any = {
                psp: false,
                gnr: false
            }

            let nif;

            // Making the request to check if the token is valid for all forces
            for (const force of ["psp", "gnr"]) {
                const response = await make_request("/account/validateToken", "POST", undefined, force);

                // If the request returned status of 200, the token is valid for that force
                if (response.status === 200) {
                    nif = (await response.json()).data;

                    // Set the force to true and also get the NIF of the user
                    forces[force] = true;
                }
            }

            // If the user is from atleast one force, get the full name + patent of the user for the selected one
            // TODO: this needs to be changed to the selected force, when the user can select the force
            await buildOfficerName(nif);
        }

        fetchForces();
    }, []);

    // Create the array of elements for the pathsdiv
    let paths = [];

    // Get the current path minus the base url
    let currentPath = location.pathname.replace(`${base_url}`, "").replace("/", "");

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

            <div className={style.navButtonsDiv} style={isLogin ? {display: "none"}: {}}>
                <Link to="/efetivos" className={style.navButton} reloadDocument={true}>Efetivos</Link>
                <Link to="/" className={style.navButton} reloadDocument={true}>Atividade</Link>
                <Link to="/" className={style.navButton} reloadDocument={true}>Avaliações</Link>
                <Link to="/" className={style.navButton} reloadDocument={true}>Patrulhas</Link>
            </div>

            {/*TODO: Add a force selector here, floating to the right side of the navbar*/}

            {/*Add the div that will hold the user info*/}
            {/*TODO: This needs to be a dropdown menu to logout, change password, etc. Check https://www.w3schools.com/css/css_dropdowns.asp for info*/}
            <div style={{display: `${isLogin ? 'none': 'block'}`}} className={style.userInfoDiv}>
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