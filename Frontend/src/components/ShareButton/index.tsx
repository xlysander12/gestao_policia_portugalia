import {BASE_URL} from "../../utils/constants.ts";
import {toast} from "react-toastify";
import ShareIcon from "@mui/icons-material/Share";
import {IconButton} from "@mui/material";
import React from "react";

type ShareButtonProps = {
    url: string
    color?: string
    size?: "small" | "medium" | "large"
}
function ShareButton({url, color, size}: ShareButtonProps) {
    // Ensure the URL has a leading slash
    url = url.startsWith("/") ? url : `/${url}`

    // Get the final URL
    const final_url = `${window.location.origin}${BASE_URL}${url}`

    return (
        <IconButton
            size={size}
            onClick={() => {
                navigator.clipboard.writeText(final_url);
                toast.info("Ligação direta copiada para a área de transferência! (CTRL + V)");
            }}
        >
            <ShareIcon
                fontSize={size}
                sx={{
                    color: color ? color : undefined,
                }}
            />
        </IconButton>
    );
}

export default ShareButton;