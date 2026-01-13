import {AutocompleteProps} from "@mui/material";

type DefaultSearchBaseOption = {
    label: string
    key: string
}

type DefaultSearchStandaloneOption = DefaultSearchBaseOption & {
    type: "standalone"
}

type DefaultSearchStringDateOption = DefaultSearchBaseOption & {
    type: "text" | "date"
}

type DefaultSearchBooleanOption = DefaultSearchBaseOption & {
    type: "boolean"
}

type DefaultSearchOptionsOption = DefaultSearchBaseOption & {
    type: "option"
    options: DefaultSearchBaseOption[]
}

type DefaultSearchAsyncOptionsOption = DefaultSearchBaseOption & {
    type: "asyncOption"
    optionsFunc: (signal: AbortSignal) => Promise<DefaultSearchBaseOption[]>
}

type DefaultSearchOption = DefaultSearchStandaloneOption
    | DefaultSearchStringDateOption
    | DefaultSearchBooleanOption
    | DefaultSearchOptionsOption
    | DefaultSearchAsyncOptionsOption

type DefaultSearchProps = Omit<AutocompleteProps<any, any, any, any>, "renderInput" | "multiple" | "options"> & {
    renderInput?: (params: AutocompleteRenderInputParams) => React.ReactNode
    options: DefaultSearchOption[]
    callback: (options: {key: string, value: any}[]) => void
    freeKey?: string
    freeMultiple?: boolean
    defaultFilters?: {key: string, value: any, label: string, labelValue: string}[]
    placeholder?: string
};