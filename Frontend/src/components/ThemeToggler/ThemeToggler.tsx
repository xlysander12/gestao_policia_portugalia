import {createTheme, ThemeProvider} from "@mui/material";
import {useMemo, useState} from "react";

type ThemeTogglerProps = {
    children: React.ReactNode
}
function ThemeToggler(props: ThemeTogglerProps) {
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    const darkTheme = useMemo(() => createTheme({
        palette: {
            mode: 'dark',
            primary: {
                main: '#435ebf',
                contrastText: '#838c9a',
            },
            secondary: {
                main: '#f50057',
            },
            background: {
                default: '#151521',
                paper: '#1e1e2d',
            },
            text: {
                primary: '#ffffff',
                secondary: '#838b96',
                disabled: '#434358',
            },
        },
    }), []);

    return (
        <ThemeProvider theme={darkTheme}>
            {props.children}
        </ThemeProvider>
    );
}

export default ThemeToggler;