import {Component} from "react";
import style from "./navbar.module.css";
import {Link} from "react-router-dom";

const SubPath = (props) => {

    if (props.path === "") {
        return (
            <div className={style.subPathDiv}>
                <p>{props.name}</p>
            </div>
        );
    }

    return (
        <div className={style.subPathDiv}>
            <Link to={props.path}>{props.name}</Link>
            <p>{props.only ? "": "»"}</p>
        </div>
    );
}

class Navbar extends Component {

    constructor(props) {
        super(props);

        this.state = {
            fullName: ""
        }
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

        // From the given NIF, get the patent and officer's full name
        let response = await fetch(`/portugalia/gestao_policia/api/officerInfo/${this.props.userNif}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token")
            },
        });

        // From the response, get the patent and officer's full name
        let body = await response.json();

        // Now, get the string equivalent to its patent
        response = await fetch(`/portugalia/gestao_policia/api/util/strPatente?patent=${body.patente}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/text",
            },
        });


        this.setState({
           fullName: `${await response.text()} ${body.nome}`
        });
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