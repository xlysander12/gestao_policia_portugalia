import ManagementBar from "../../../../components/ManagementBar";
import {DefaultSelect, DefaultTypography} from "../../../../components/DefaultComponents";
import {useForceData} from "../../../../hooks";
import {Divider, MenuItem} from "@mui/material";
import {useEffect, useState} from "react";
import {SpecialUnitData, UtilSpecialUnitsActiveResponse} from "@portalseguranca/api-types/util/output";
import { MinifiedOfficerData } from "@portalseguranca/api-types/officers/output";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import OfficerList from "../../../../components/OfficerList";
import Gate from "../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../components/Loader";

function SpecialUnitActiveMembers() {
    const [forceData] = useForceData();

    const [loading, setLoading] = useState<boolean>(false);

    const [selected, setSelected] = useState<SpecialUnitData>(forceData.special_units[0] ?? undefined);
    const [active, setActive] = useState<MinifiedOfficerData[]>([]);

    async function fetchActiveMembers(signal: AbortSignal) {
        setLoading(true);

        const response = await make_request(`/util/special-units/${selected.id}/active`, RequestMethod.GET, {signal});
        const responseJson = await response.json() as UtilSpecialUnitsActiveResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            setActive([]);
            setLoading(false);
            return;
        }

        setActive(responseJson.data);

        setLoading(false);
    }

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        void fetchActiveMembers(signal);

        return () => controller.abort();
    }, [selected.id]);

    return (
        <>
            <ManagementBar>
                <div
                    style={{
                        width: "100%"
                    }}
                >
                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Escolhe uma Unidade Especial:</DefaultTypography>
                    <DefaultSelect
                        fullWidth
                        value={selected.id}
                        onChange={(event) =>
                            setSelected(forceData.special_units.find(unit => unit.id === event.target.value as number)!)}
                    >
                        {forceData.special_units.map(unit => {
                            return (
                                <MenuItem key={`specialunit#${unit.id}`} value={unit.id}>{unit.name}</MenuItem>
                            );
                        })}
                    </DefaultSelect>
                </div>
            </ManagementBar>

            <Divider />

            <div
                style={{
                    boxSizing: "border-box",
                    backgroundColor: "var(--portalseguranca-color-background-dark)",
                    height: "calc(100% - 5.4rem)",
                    paddingTop: "10px",
                }}
            >
                <Gate show={loading}>
                    <Loader fullDiv />
                </Gate>

                <Gate show={!loading && active.length > 0}>
                    <OfficerList
                        disabled
                        invisibleDisabled
                        startingOfficers={active}
                        changeCallback={() => {}}
                    />
                </Gate>

                <Gate show={!loading && active.length === 0}>
                    <div
                        style={{
                            textAlign: "center"
                        }}
                    >
                        <DefaultTypography fontSize={"larger"}>Sem Resultados</DefaultTypography>
                    </div>
                </Gate>
            </div>
        </>
    );
}

export default SpecialUnitActiveMembers;