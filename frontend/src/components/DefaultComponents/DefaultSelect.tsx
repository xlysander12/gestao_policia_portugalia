import {styled} from "@mui/material/styles";
import {Select, SelectProps} from "@mui/material";

// @ts-ignore
const DefaultSelectStyle = styled(Select)(({sameTextColorWhenDisabled}) => ({
    "& .MuiSelect-icon": {
        color: "var(--portalseguranca-color-accent)",

        "&.Mui-disabled": {
            display: "none",
        },
    },

    "& .MuiInput-input": {
        fontWeight: 500,
        WebkitTextFillColor: `${sameTextColorWhenDisabled ? "var(--portalseguranca-color-text-light)": "#d0c7d380"} !important`,

        "&.Mui-disabled": {
            WebkitTextFillColor: "var(--portalseguranca-color-text-light)",
            WebkitUserSelect: "auto",
            userSelect: "auto"
        }
    }
}));
const DefaultSelectSlotProps = {
    root: {
        sx: {
            "label+&": {
                margin: 0
            },

            "&:before": {
                borderBottom: "3px solid #049985"
            },

            "&:hover:not(.Mui-disabled, .Mui.error):before": {
                borderBottom: "3px solid #049985"
            },

            "&.Mui-disabled:before": {
                border: 0
            },

            "&:after": {
                borderBottom: "3px solid #00fdfd"
            },
        }
    }
}
const DefaultSelect = (props: Partial<SelectProps> & {sameTextColorWhenDisabled?: boolean}) => {
    return (
        <DefaultSelectStyle
            variant={"standard"}
            slotProps={DefaultSelectSlotProps}
            {...props}
        >
            {props.children}
        </DefaultSelectStyle>
    );
}

export default DefaultSelect;