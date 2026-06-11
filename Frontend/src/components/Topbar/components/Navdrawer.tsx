import {
    Box,
    Divider,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography
} from "@mui/material";
import {BASE_URL} from "../../../utils/constants.ts";
import {useState} from "react";
import Gate from "../../Gate/gate.tsx";
import {
    AlarmOnOutlined,
    AssignmentOutlined, CalculateOutlined,
    GridViewOutlined,
    MinorCrashOutlined,
    PortraitOutlined, SummarizeOutlined, TerminalOutlined
} from "@mui/icons-material";
import {Link, useLocation} from "react-router-dom";

type NavmenuProps = {
    open: boolean
    onClose: () => void
}
function Navdrawer(props: NavmenuProps) {
    // Calculate which page are we in right now
    const location = useLocation();

    console.log(location.pathname);

    return (
        <Drawer
            open={props.open}
            onClose={props.onClose}
        >
            <Box
                sx={{
                    width: "300px",
                    height: "100%",
                    bgcolor: "background.paper",
                    padding: "10px",

                    display: "flex",
                    flexDirection: "column",
                    gap: "15px"
                }}
                role={"presentation"}
                onClick={props.onClose}
            >
                <div style={{display: "flex", flexDirection: "column"}}>
                    <img
                        src={`${BASE_URL}/titles/${localStorage.getItem("force")!}.png`}
                        alt={"Logo força"}
                        style={{
                            alignSelf: "center",
                            maxWidth: "250px"
                        }}
                    />

                    <Divider/>
                </div>

                <List>
                    <Typography color={"textSecondary"}>Navegação</Typography>
                    <div style={{display: "flex", flexDirection: "column", gap: "5px"}}>
                        {
                            [
                                {title: "Dashboard", icon: <GridViewOutlined/>, path: "/"},
                                {title: "Patrulhas", icon: <MinorCrashOutlined/>, path: "/patrulhas"},
                                {title: "Efetivos", icon: <PortraitOutlined/>, path: "/efetivos"},
                                {title: "Avaliações", icon: <AssignmentOutlined/>, path: "/avaliacoes"},
                                {title: "Atividade", icon: <AlarmOnOutlined/>, path: "/atividade"}
                            ].map((item) => (
                                <ListItem disablePadding key={item.title}>
                                    <Link to={item.path} style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
                                        <ListItemButton
                                            selected={location.pathname === item.path}
                                            sx={{
                                                borderRadius: "10px",
                                                "&.Mui-selected": {
                                                    bgcolor: "primary.main",

                                                    "&:hover": {
                                                        bgcolor: "primary.main"
                                                    }
                                                }
                                            }}>
                                            <ListItemIcon>{item.icon}</ListItemIcon>
                                            <ListItemText
                                                slotProps={{
                                                    primary: {
                                                        sx: {
                                                            fontSize: "1.3rem"
                                                        }
                                                    }
                                                }}
                                                primary={item.title}
                                            />
                                        </ListItemButton>
                                    </Link>
                                </ListItem>
                            ))
                        }
                    </div>

                    <Divider sx={{paddingTop: "5px"}}/>
                </List>

                <List sx={{paddingTop: 0}}>
                    <Typography color={"textSecondary"}>Ferramentas</Typography>
                    <div style={{display: "flex", flexDirection: "column", gap: "5px"}}>
                        {
                            [
                                {title: "HUB", icon: <TerminalOutlined/>, path: "https://docs.google.com/spreadsheets/d/1njVG8I39KKxX5SrHYQsngUCXvrdUQlzPjWcVdgxvSXk"},
                                {title: "Calculadora Crimes", icon: <CalculateOutlined/>, path: "https://www.crunchypi.xyz/portugalia/calculadora_crimes"},
                                {title: "Código Penal", icon: <SummarizeOutlined/>, path: "https://drive.google.com/file/d/17uWqHmNWbosthGiLpo7Wo7eP0AaSAwg8/view"}
                            ].map((item) => (
                                <ListItem disablePadding key={item.title}>
                                    <Link to={item.path} style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
                                        <ListItemButton  sx={{
                                            borderRadius: "10px"
                                        }}>
                                            <ListItemIcon>{item.icon}</ListItemIcon>
                                            <ListItemText
                                                slotProps={{
                                                    primary: {
                                                        sx: {
                                                            fontSize: "1.3rem"
                                                        }
                                                    }
                                                }}
                                                primary={item.title}
                                            />
                                        </ListItemButton>
                                    </Link>
                                </ListItem>
                            ))
                        }
                    </div>

                    <Divider sx={{paddingTop: "5px"}}/>
                </List>
            </Box>
        </Drawer>
    );
}

export default Navdrawer;