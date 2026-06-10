import {scan} from "react-scan";
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import moment from "moment";
import 'moment/dist/locale/pt';
import momentDurationFormatSetup from "moment-duration-format";

momentDurationFormatSetup(moment);
moment.updateLocale('pt', {
    months: 'Janeiro_Fevereiro_Março_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro'.split('_')
});

scan({
    enabled: false
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
            <App/>
    </React.StrictMode>,
);
