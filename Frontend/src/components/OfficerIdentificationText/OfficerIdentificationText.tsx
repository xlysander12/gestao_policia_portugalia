import React, {useState, MouseEvent} from "react";
import {Menu, MenuItem} from "@mui/material";
import { MinifiedOfficerData } from "@portalseguranca/api-types/officers/output";
import {DefaultTypography} from "../DefaultComponents";
import {DefaultTypographyProps} from "../DefaultComponents/DefaultTypography.tsx";
import {useForceData} from "../../hooks";
import {getObjectFromId} from "../../forces-data-context.ts";
import DefaultLink from "../DefaultComponents/DefaultLink.tsx";

type OfficerContextMenuProps = DefaultTypographyProps & {
    officer: MinifiedOfficerData
    prefix?: string
    suffix?: string
    showCallsign?: boolean
    showNif?: boolean
    hidePatent?: boolean
    disabled?: boolean
}
function OfficerIdentificationText(props: OfficerContextMenuProps) {
    const [, getForceData] = useForceData();

    const [open, setOpen] = useState<boolean>(false);
    // anchorPosition will be used to position the menu at a given viewport coordinate.
    // We'll use the element's bottom for the vertical position and the cursor X for horizontal.
    const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);

    function handleClick(event: MouseEvent<HTMLElement>) {
        event.preventDefault();
        const el = event.currentTarget as HTMLElement;
        const rect = el.getBoundingClientRect();

        // Use element's bottom for vertical alignment and cursor X for horizontal position
        const top = Math.round(rect.bottom);
        const left = Math.round(event.clientX);

        setAnchorPosition({ top, left });
        setOpen(true);
    }

    function onClose() {
        setAnchorPosition(null);
        setOpen(false);
    }

    return (
        <>
            <DefaultTypography
                {...props}
                clickable={props.officer.force === undefined || props.officer.force === localStorage.getItem("force")!}
                onClick={handleClick}
            >
                {
                  props.prefix ? `${props.prefix} ` : ""
                } {
                    props.showCallsign ? `[${props.officer.callsign}]` : ""
                } {
                    !props.hidePatent ? getObjectFromId(props.officer.patent, getForceData(props.officer.force ?? localStorage.getItem("force")!).patents)!.name : ""
                } {
                    props.officer.name
                } {
                  props.showNif ? `(#${props.officer.nif})` : ""
                } {
                    props.suffix ? ` ${props.suffix}` : ""
                }
            </DefaultTypography>

            <Menu
                open={open}
                // Use anchorPosition so we can control horizontal position based on cursor
                anchorReference={anchorPosition ? 'anchorPosition' : 'anchorEl'}
                anchorPosition={anchorPosition ?? undefined}
                transformOrigin={{
                     vertical: 'top',
                     horizontal: 'left'
                }}
                onClose={onClose}
            >
                <DefaultLink disableClickable to={`/efetivos/${props.officer.nif}`}>
                    <MenuItem>Informações</MenuItem>
                </DefaultLink>

                <DefaultLink disableClickable to={`/atividade/${props.officer.nif}`}>
                    <MenuItem>Atividade</MenuItem>
                </DefaultLink>

                <DefaultLink disableClickable to={`/avaliacoes/${props.officer.nif}`}>
                    <MenuItem>Avaliações</MenuItem>
                </DefaultLink>
            </Menu>
        </>
    )
}

 export default OfficerIdentificationText;
