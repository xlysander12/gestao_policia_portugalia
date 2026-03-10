import JsonView, {JsonViewProps} from "@uiw/react-json-view";
import {vscodeTheme} from "@uiw/react-json-view/vscode";
import {PropsWithRef} from "react";

type JsonViewerProps = PropsWithRef<JsonViewProps<object>>;
function JsonViewer(props: JsonViewerProps) {
    return (
        <JsonView
            style={{
                ...vscodeTheme,
                "--w-rjv-background-color": "transparent",
                textAlign: "left"
            } as React.CSSProperties}
            displayDataTypes={false}
            enableClipboard={false}
            highlightUpdates={false}
            shortenTextAfterLength={0}
            displayObjectSize={false}
            {...props}
        />
    );
}

export default JsonViewer;