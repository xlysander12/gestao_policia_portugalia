import styled from "styled-components";
import Popup from "reactjs-popup";
import React, {ReactElement, useEffect, useRef} from "react";
import style from "./modal.module.css";
import {Button, Divider} from "@mui/material";
import {DefaultTypography} from "../DefaultComponents";
import Gate from "../Gate/gate";
import ShareButton from "../ShareButton";

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
        background-color: var(--portalseguranca-color-background-dark);
        border: 2px solid black;
        border-radius: 3px;
    }

`;

type ModalProps = {
    open: boolean
    onClose?: () => void
    width?: string
    height?: string
    title: string
    disableScroll?: boolean
    url?: string
    children: ReactElement | ReactElement[]
}

export function Modal({open, onClose, width, height, title, disableScroll, url, children}: ModalProps): ReactElement {
    // if (disableScroll && !height) throw new Error("If disableScroll is true, height must be defined");

    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = React.useState<string | undefined>(undefined);

    useEffect(() => {
        const checkHeight = () => {
            if (!disableScroll) {
                setContentHeight(undefined);
                return;
            }

            if (contentRef.current) {
                console.log("Ref is initialized");
                const element = contentRef.current;

                console.log(element.scrollHeight, element.clientHeight);

                if (element.scrollHeight >= element.clientHeight) {
                    setContentHeight("80vh");
                } else {
                    setContentHeight(undefined);
                }
            }
        }

        checkHeight();

        window.addEventListener("resize", checkHeight);

        return () => window.removeEventListener("resize", checkHeight);
    }, [children, disableScroll, contentHeight]);

    return (
        <ModalStyle
            open={open}
            onClose={onClose}
            width={width}
            modal
            nested
        >
            {/*Header of the modal*/}
            <div className={style.header}>
                <DefaultTypography color={"white"} fontSize={"20px"}>{title}</DefaultTypography>
                <Gate show={url !== undefined}>
                    <ShareButton
                        url={url!}
                        size={"small"}
                        color={"white"}
                    />
                </Gate>
            </div>

            <Divider
                sx={{
                    borderWidth: "1px",
                    borderColor: "rgba(0, 0, 0, 0.3)"
                }}
            />

            {/*Body of the modal*/}
            <div
                className={style.content}
                ref={contentRef}
                style={{
                    height: height ? height : (contentHeight || "auto"),
                    overflowY: disableScroll ? "hidden" : "auto"
                }}
            >
                {children}
            </div>

        </ModalStyle>
    );
}

type ModalSectionProps = {
    title: string
    titleCentered?: boolean
    autoWidth?: boolean
    children: ReactElement | ReactElement[]
}

export function ModalSection({title, titleCentered = false, autoWidth = false, children}: ModalSectionProps): ReactElement {
    return (
        <fieldset className={style.section} style={autoWidth ? {width: "fit-content"} : {}}>
            {title ? <legend style={titleCentered ? {textAlign: "center"}: {textAlign: "start"}}>{title}</legend> : null}
            {children}
        </fieldset>
    );
}

type ConfirmationDialogProps = {
    open: boolean,
    title: string,
    text: string,
    onConfirm: (event: any) => void,
    onDeny: (event: any) => void,
}
export function ConfirmationDialog({open, title, text, onConfirm, onDeny}: ConfirmationDialogProps): ReactElement {
    return (
        <ModalStyle
            open={open}
            onClose={onDeny}
            width={"30%"}
            modal
            nested
        >
            <div className={style.header}>{title}</div>

            <Divider
                sx={{
                    borderWidth: "1px",
                    borderColor: "rgba(0, 0, 0, 0.3)"
                }}
            />

            {/*Text of the dialog*/}
            <div className={style.content} style={{textAlign: "left"}}>
                {text.split("\n").map((line, index) => <DefaultTypography key={index}>{line}</DefaultTypography>)}
            </div>

            {/*Cancel and Accept buttons*/}
            <div className={style.confimationButtonsDiv}>
                <Button onClick={onDeny}>
                    Cancelar
                </Button>

                <Button onClick={() => {onConfirm(null); onDeny(null)}}>
                    Aceitar
                </Button>
            </div>
        </ModalStyle>
    )
}