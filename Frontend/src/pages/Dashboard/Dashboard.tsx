import styles from "./dashboard.module.css";
import ScreenSplit from "../../components/ScreenSplit/screen-split.tsx";
import ManagementBar from "../../components/ManagementBar";
import {DefaultSelect, DefaultTypography} from "../../components/DefaultComponents";
import {AnnouncementsPanel, ForceCalendar, SpecialUnitActiveMembers} from "./components";
import {PatrolQuickCreator} from "../../components/PatrolCreator";
import {useState} from "react";
import {MenuItem, Select, styled} from "@mui/material";
import Gate from "../../components/Gate/gate.tsx";

const MiddleComponentSelectStyle = styled(Select)(() => ({
    // Remove the border
    "& .MuiOutlinedInput-notchedOutline": {
        border: 0
    },

    // Apply the same color as the text at the icon
    "& .MuiSelect-icon": {
        color: "white"
    },

    // Apply same color and font size as the other text in the navbar
    "& .MuiOutlinedInput-input": {
        WebkitTextFillColor: "white"
    },
    fontSize: "xx-large",

    // Darken background when hovering
    "&:hover": {
        backgroundColor: "var(--portalseguranca-color-hover-dark)"
    }
}))

function Dashboard() {
    const [middleComponent, setMiddleComponent] = useState<"units" | "announcements">("announcements");

    return (
        <ScreenSplit
            leftSidePercentage={45}
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
                                CALENDÁRIO
                            </DefaultTypography>
                        </div>
                    </ManagementBar>

                    <div className={styles.componentInnerDiv} style={{paddingLeft: "0.7rem"}}>
                        <ForceCalendar />
                    </div>
                </>
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
                                <MiddleComponentSelectStyle
                                    fullWidth
                                    value={middleComponent}
                                    onChange={(event) => {
                                        setMiddleComponent(event.target.value as "units" | "announcements")
                                    }}
                                    sx={{
                                        textAlign: "center"
                                    }}
                                >
                                    <MenuItem value={"announcements"}>ANÚNCIOS</MenuItem>
                                    <MenuItem value={"units"}>UNIDADES ESPECIAIS</MenuItem>
                                </MiddleComponentSelectStyle>
                            </div>
                        </ManagementBar>

                        <div className={styles.componentInnerDiv}>
                            <Gate show={middleComponent === "announcements"}>
                                <AnnouncementsPanel/>
                            </Gate>

                            <Gate show={middleComponent === "units"}>
                                <SpecialUnitActiveMembers />
                            </Gate>
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

                <div className={styles.componentInnerDiv}>
                    <PatrolQuickCreator />
                </div>
            </ScreenSplit>
        </ScreenSplit>
    );
}

export default Dashboard;