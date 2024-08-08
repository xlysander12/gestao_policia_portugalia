import styled from "styled-components";
import Popup from "reactjs-popup";
import React, {ReactElement} from "react";
import style from "./modal.module.css";
import {Divider} from "@mui/material";

const ModalStyle = styled(Popup)<{ width?: string }>`
    @keyframes anvil {
        0% {
            transform: scale(1) translateY(0px);
            opacity: 0;
            box-shadow: 0 0 0 rgb(241, 241, 241, 0);
        }
        1% {
            transform: scale(0.96) translateY(10px);
            opacity: 0;
            box-shadow: 0 0 0 rgb(241, 241, 241, 0);
        }
        100% {
            transform: scale(1) translateY(0px);
            opacity: 1;
            box-shadow: 0 0 500px rgb(241, 241, 241, 0);
        }
    }

    &-overlay {
        background-color: rgba(0, 0, 0, 0.7);
    }

    &-content {
        animation: anvil 0.3s cubic-bezier(0.38, 0.1, 0.36, 0.9) forwards;
        width: ${props => props.width || "37%"};
        min-width: fit-content;
        background-color: #1f2833;
        border: 2px solid black;
        border-radius: 3px;
    }

`;

type ModalProps = {
    trigger: ReactElement,
    width?: string,
    title: string,
    children: ReactElement | ReactElement[],
}

export function Modal({trigger, width, title, children}: ModalProps): ReactElement {
    return (
        <ModalStyle
            trigger={trigger}
            width={width}
            modal
        >
            {/*Header of the modal*/}
            <div className={style.header}>{title}</div>

            <Divider
                sx={{
                    borderWidth: "1px",
                    borderColor: "rgba(0, 0, 0, 0.3)"
                }}
            />

            {/*Body of the modal*/}
            <div className={style.content}>
                {children}
            </div>

        </ModalStyle>
    );
}

type ModalSectionProps = {
    title: string
    titleCentered?: boolean
    children: ReactElement | ReactElement[]
}

export function ModalSection({title, titleCentered = false, children}: ModalSectionProps): ReactElement {
    // TODO: Add a margin to the bottom of the section
    return (
        <fieldset className={style.section}>
            {title ? <legend style={titleCentered ? {textAlign: "center"}: {textAlign: "start"}}>{title}</legend> : null}
            {children}
        </fieldset>
    );
}