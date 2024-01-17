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

    render() {

        if (this.props.path !== undefined) {
            return (
                <div className={style.mainNavbar}>
                    <SubPath path="/" name="Portal Segurança"/>
                    {this.props.path.map(path => {
                        if (path[1] !== "") {
                            return <SubPath key={path[0]} path={path[1]} name={path[0]}/>
                        }

                        return <SubPath key={path[0]} path="" name={path[0]}/>
                    })}
                </div>
            );
        }

        return (
            <div className={style.mainNavbar}>
                <SubPath path="/" name="Portal Segurança" only={true}/>
            </div>
        );
    }
}

export default Navbar;