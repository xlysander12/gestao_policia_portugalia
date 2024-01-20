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
            fullName: ""
        }

        this.buildOfficerName = this.buildOfficerName.bind(this);
    }

    async buildOfficerName(nif) {
        // From the given NIF, get the patent and officer's full name
        let response = await fetch(`/portugalia/gestao_policia/api/officerInfo/${nif}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token")
            },
        });

        // From the response, get the patent and officer's full name
        let body = await response.json();


        this.setState({
            fullName: `${body.data.patente} ${body.data.nome}`
        });
    }

    async componentDidMount() {
        if(window.location.pathname === "/login") {
            return;
        }

        // Check if there is a token in the local storage
        if ((!localStorage.getItem("token"))) {
            window.location.href = "/login";
            return;
        }

        // Making the request to check if the token is valid
        let response = await fetch("/portugalia/gestao_policia/api/validateToken", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token")
            }
        });

        // If the request returned status different that 200, the token is invalid
        if (response.status !== 200) {
            window.location.href = "/login";
            return;
        }

        // If the request returned status 200, the token is valid
        let nif = (await response.json()).data;
        console.log("Updating the navbar's state nif to " + nif);

        await this.buildOfficerName(nif);
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        // If nothing changed, no need to update anything
        if (prevProps.userNif === this.props.userNif) {
            return;
        }

        // Check if there was any NIF passed in as props. If there isn't, don't update anything
        if (this.props.userNif === undefined || this.props.userNif === "" || this.props.userNif === null) {
            return;
        }

        await this.buildOfficerName(this.props.userNif);
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

                {/*Add the div that will hold the user info*/}
                <div className={style.userInfoDiv}>
                    <p className={style.officerName}>{this.state.fullName}</p>
                </div>
            </div>
        );
    }
}

export default Navbar;