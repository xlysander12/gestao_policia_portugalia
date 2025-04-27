import {DefaultTypography} from "../../components/DefaultComponents";
import Gate from "../../components/Gate/gate";

function UnexpectedError() {
    // Get the error code from the URL Query Params
    const code = new URLSearchParams(window.location.search).get("code");

    return (
        <div>
            <DefaultTypography color={"black"} fontSize={"xx-large"}>Ups... Algo correu mal!</DefaultTypography>
            <DefaultTypography color={"black"} fontSize={"larger"}>Eu também não sei o que correu de mal...</DefaultTypography>
            <Gate show={code !== null}>
                <DefaultTypography color={"black"}>Mas há um código de erro para reportar: {code}</DefaultTypography>
            </Gate>
        </div>
    );
}

export default UnexpectedError;