import React, {Component} from "react";
import style from "./officerinfo.module.css";
import Navbar from "../../components/Navbar/navbar";
import OfficerList from "../../components/OfficerList/officerlist";


class OfficerInfo extends Component {
    constructor(props) {
        super(props);
    }

    render(){
        return(
            <div>
                <Navbar path={[["Efetivos", ""]]}/>
                <div>
                    <div className={style.officerListDiv}>
                        <OfficerList/>
                    </div>

                    {/*<div className={style.officerInfoDiv}>*/}
                    {/*    <h1>Officer Info</h1>*/}
                    {/*</div>*/}
                </div>
            </div>
        )
    }
}

export default OfficerInfo;