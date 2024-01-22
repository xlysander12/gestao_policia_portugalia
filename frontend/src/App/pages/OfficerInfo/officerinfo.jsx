import React, {Component} from "react";
import style from "./officerinfo.module.css";
import Navbar from "../../components/Navbar/navbar";
import OfficerList from "../../components/OfficerList/officerlist";


class OfficerInfo extends Component {
    constructor(props) {
        super(props);

        this.state = {
            officerNif: ""
        }

        this.officerListCallback = this.officerListCallback.bind(this);
    }

    officerListCallback(nif) {
        this.setState({
            officerNif: nif
        })
    }

    render(){
        return(
            <div>
                <Navbar path={[["Efetivos", ""]]}/>
                <div style={{display: "flex"}}>
                    <div className={style.officerListDiv}>
                        <OfficerList callbackFunction={this.officerListCallback}/>
                    </div>

                    <div className={style.officerInfoDiv}>
                        <h1>{this.state.officerNif}</h1>
                    </div>
                </div>
            </div>
        )
    }
}

export default OfficerInfo;