import {createContext} from "react";


export const CurrentForce = createContext<string>(localStorage.getItem("force") ||  "");