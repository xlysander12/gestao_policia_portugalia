import styles from "./dashboard.module.css";
import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import ManagementBar from "../../components/ManagementBar";
import {DefaultTypography} from "../../components/DefaultComponents";
import {SpecialUnitActiveMembers} from "./components";

function Dashboard() {
    return (
        <ScreenSplit
            leftSidePercentage={45}
            leftSideComponent={
                <ManagementBar>
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <DefaultTypography
                            color={"white"}
                            fontSize={"xx-large"}
                        >
                            CALENDÁRIO
                        </DefaultTypography>
                    </div>
                </ManagementBar>
        }
        >
            <ScreenSplit
                leftSidePercentage={50}
                leftSideComponent={
                    <>
                        <ManagementBar>
                            <div
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <DefaultTypography
                                    color={"white"}
                                    fontSize={"xx-large"}
                                >
                                    UNIDADES ESPECIAIS
                                </DefaultTypography>
                            </div>
                        </ManagementBar>

                        <div className={styles.componentInnerDiv}>
                            <SpecialUnitActiveMembers />
                        </div>
                    </>
                }
            >
                <ManagementBar>
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <DefaultTypography
                            color={"white"}
                            fontSize={"xx-large"}
                        >
                            PATRULHA RÁPIDA
                        </DefaultTypography>
                    </div>
                </ManagementBar>
            </ScreenSplit>
        </ScreenSplit>
    );
}

export default Dashboard;