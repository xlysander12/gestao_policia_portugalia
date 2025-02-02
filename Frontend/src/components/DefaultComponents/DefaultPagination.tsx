import {styled} from "@mui/system";
import {Pagination, PaginationProps} from "@mui/material";

type DefaultPaginationProps = Partial<PaginationProps> & {
    lightBackground?: boolean
};

const DefaultPaginationStyle = styled(Pagination, {
    shouldForwardProp: (prop) => prop !== "lightBackground"
})<DefaultPaginationProps>(({lightBackground}) => ({
    "& .MuiButtonBase-root": {
        backgroundColor: `${lightBackground ? "var(--portalseguranca-color-background-dark)": "var(--portalseguranca-color-background-light)"}`,
        color: `${lightBackground ? "var(--portalseguranca-color-text-light)": "var(--portalseguranca-color-text-dark)"}`,

        "&:hover": {
            backgroundColor: `${lightBackground ? "var(--portalseguranca-color-hover-dark)": "var(--portalseguranca-color-hover-light)"}`
        },

        "&.Mui-selected": {
            backgroundColor: "var(--portalseguranca-color-accent)",
            color: "white"
        }
    }
}));

const DefaultPagination = ({lightBackground, ...props}: DefaultPaginationProps) => {
    return (
        <DefaultPaginationStyle
            lightBackground={lightBackground}
            {...props}
        />
    );
};

export default DefaultPagination;