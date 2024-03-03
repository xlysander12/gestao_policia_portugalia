import {Component} from "react";
import style from "./navbar.module.css";
import {Link} from "react-router-dom";

const SubPath = (props) => {

    if (props.path === "") {
        return (
            <div className={style.subPathDiv}>
                <p className={style.navbarSubPathText}>{props.name}</p>
            </div>
        );
    }

    return (
        <div className={style.subPathDiv}>
            <Link className={style.navbarSubPathText} to={props.path}>{props.name}</Link>
            <p className={style.navbarSubPathText}>{props.only ? "": "»"}</p>
        </div>
    );
}

class Navbar extends Component {

    constructor(props) {
        super(props);

        this.state = {
            isLogin: false,

            fullName: "",
        }

        this.buildOfficerName = this.buildOfficerName.bind(this);
    }

    async buildOfficerName(nif) {
        // From the given NIF, get the patent and officer's full name
        let response = await fetch(`/portugalia/gestao_policia/api/officerInfo/${nif}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token"),
                "X-PortalSeguranca-Force": localStorage.getItem("force")
            },
        });

        // From the response, get the patent and officer's full name
        let body = await response.json();


        this.setState({
            fullName: `${body.data.patente} ${body.data.nome}`
        });
    }

    async componentDidMount() {
        if (window.location.pathname === "/login") {
            this.setState({
                isLogin: true
            });
            return;
        }

        let forces = {
            psp: false,
            gnr: false
        }
        let nif;

        // Making the request to check if the token is valid for all forces
        for (const force of ["psp", "gnr"]) {
            const response = await fetch("/portugalia/gestao_policia/api/validateToken", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("token"),
                    "X-PortalSeguranca-Force": force
                }
            });

            // If the request returned status of 200, the token is valid for that force
            if (response.status === 200) {
                nif = (await response.json()).data;

                // Set the force to true and also get the NIF of the user
                forces[force] = true;
            }
        }

        // If the user is from atleast one force, get the full name + patent of the user for the first one
        await this.buildOfficerName(nif);
    }

    render() {
        // Create the array of elements for the pathsdiv
        let paths = [];

        // First thing that needs to be done is to add the main title to the navbar
        paths.push(<SubPath key="main" path="/" name="Portal Segurança" only={this.props.path === undefined}/>);

        // If there are paths passed in as props, add them to the navbar
        if (this.props.path !== undefined) {
            this.props.path.forEach(path => {

                if (path[1] === "") { // If the path doesn't have a redirect, add it like a finished path
                    paths.push(<SubPath key={path[0]} path="" name={path[0]}/>);
                } else { // If the path has a redirect, add it to the navbar aswell
                    paths.push(<SubPath key={path[0]} path={path[1]} name={path[0]}/>);
                }
            });
        }

        // noinspection com.intellij.reactbuddy.ArrayToJSXMapInspection
        return (
            <div className={style.mainNavbar}>
                {/*Add the div that will hold the paths*/}
                <div className={style.pathsDiv}>
                    {paths}
                </div>

                <div className={style.navButtonsDiv} style={this.state.isLogin ? {display: "none"}: {}}>
                    <Link to="/efetivos" className={style.navButton}>Efetivos</Link>
                    <Link to="/" className={style.navButton}>Inatividade</Link>
                    <Link to="/" className={style.navButton}>Avaliações</Link>
                    <Link to="/" className={style.navButton}>Patrulhas</Link>
                </div>

                {/*Add the div that will hold the user info*/}
                <div className={style.userInfoDiv}>
                    <p className={style.officerName}>{this.state.fullName}</p>
                </div>
            </div>
        );
    }
}

export default Navbar;