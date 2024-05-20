import styled from "styled-components";
import Popup from "reactjs-popup";

const StyledRecruitModal = styled(Popup)`
    &-overlay {
        background-color: rgba(0, 0, 0, 0.7);
    }
    
    &-content {
        width: ${(props) => props.width || "37%"};
        border: 2px solid #3498db;
    }
    `;

export default StyledRecruitModal;