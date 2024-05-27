import styled from "styled-components";
import Popup from "reactjs-popup";
import React, {Component} from "react";
import style from "./modal.module.css";

// TODO: This must be a templete of how a modal should look like
const ModalStyle = styled(Popup)`
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
        width: ${(props) => props.width || "37%"};
        border: 2px solid #3498db;
    }
    
    `;

class Modal extends Component {
    render() {
        return (
            <ModalStyle
                trigger={this.props.trigger}
                width={this.props.width}
                modal
            >
                {/*Header of the modal*/}
                <div className={style.header}>{this.props.title}</div>

                {/*Body of the modal*/}
                {this.props.children}
            </ModalStyle>
        );
    }
}

export default Modal;