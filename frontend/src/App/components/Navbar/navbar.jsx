import React, {Component} from "react";
import style from "./navbar.module.css";
import {Link, Navigate} from "react-router-dom";
import {make_request} from "../../utils/requests";
import {toast} from "react-toastify";

const SubPath = (props) => {

    // Not a reidirect
    if (props.path === "") {
        return (
            <div className={style.subPathDiv}>
                <p className={style.navbarSubPathText}>{props.name}</p>
            </div>
        );
    }

    return (
        <div className={style.subPathDiv}>
            <Link className={`${style.navbarSubPathText} ${style.navbarRedirect}`} to={props.path} reloadDocument={true}>{props.name}</Link>
            <p className={style.navbarSubPathText}>{props.only ? "": "»"}</p>
        </div>
    );
}

class Navbar extends Component {

    constructor(props) {
        super(props);

        // Set the state of the component
        this.state = {
            fullName: "",
            validLogin: true
        }

        // Check if we are in the login page
        this.isLogin = window.location.pathname === "/portugalia/portalseguranca/login";

        // Bind the function to the component
        this.buildOfficerName = this.buildOfficerName.bind(this);
    }

    async buildOfficerName(nif) {
        // From the given NIF, get the patent and officer's full name
        let response = await make_request(`/officerInfo/${nif}`, "GET");

        // Mandatory check if the status code was 200
        // This shouldn't ever happen because PrivateRoute should redirect to the login page if the token is invalid, but you never know...
        if (!response.ok) {
            // If the status code wasn't 200, the token is most likely invalid or something really bad happened, redirect to the login page
            this.setState({
                validLogin: false
            })
            return;
        }

        // From the response, get the patent and officer's full name
        let body = await response.json();

        // Build the officer's full name
        let fullName = `${body.data.patent} ${body.data.name}`;

        // Set the full name of the officer
        this.setState({
            fullName: fullName
        });

        // Save the full name in the session storage
        sessionStorage.setItem("navbarFullName", fullName);
    }

    async componentDidMount() {
        // If we are in the login page, there's nothing to do
        if (this.isLogin) {
            return;
        }

        let forces = {
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

        // If the user is from atleast one force, get the full name + patent of the user for the first one
        // TODO: this needs to be changed to the selected force, when the user can select the force
        await this.buildOfficerName(nif);
    }

    render() {
        if (!this.state.validLogin) {
            return (
                <Navigate to="/login"/>
            );
        }

        // Create the array of elements for the pathsdiv
        let paths = [];

        // First thing that needs to be done is to add the main title to the navbar
        paths.push(<SubPath key="navbarMainPath" path="/" name="Portal Segurança" only={this.props.path === undefined}/>);

        // If there are paths passed in as props, add them to the navbar
        if (this.props.path !== undefined) {
            this.props.path.forEach(path => {
                paths.push(<SubPath key={`navbarPath${path[0]}`} path={path[1]} name={path[0]}/>);
            });
        }

        // noinspection com.intellij.reactbuddy.ArrayToJSXMapInspection
        return (
            <div className={style.mainNavbar}>

                {/*Add the div that will hold the paths*/}
                <div className={style.pathsDiv}>
                    {paths}
                </div>

                <div className={style.navButtonsDiv} style={this.isLogin ? {display: "none"}: {}}>
                    <Link to="/efetivos" className={style.navButton} reloadDocument={true}>Efetivos</Link>
                    <Link to="/" className={style.navButton} reloadDocument={true}>Atividade</Link>
                    <Link to="/" className={style.navButton} reloadDocument={true}>Avaliações</Link>
                    <Link to="/" className={style.navButton} reloadDocument={true}>Patrulhas</Link>
                </div>

                {/*TODO: Add a force selector here, floating to the right side of the navbar*/}

                {/*Add the div that will hold the user info*/}
                {/*TODO: This needs to be a dropdown menu to logout, change password, etc. Check https://www.w3schools.com/css/css_dropdowns.asp for info*/}
                <div style={{display: `${this.isLogin ? 'none': 'block'}`}} className={style.userInfoDiv}>
                    <p className={style.officerName}>{sessionStorage.getItem("navbarFullName") !== null && this.state.fullName === "" ? sessionStorage.getItem("navbarFullName"): this.state.fullName}</p>
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
}

export default Navbar;