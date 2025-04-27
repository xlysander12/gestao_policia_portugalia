import {Autocomplete, Popover} from "@mui/material";
import {DefaultDateCalendar, DefaultOutlinedTextField} from "../index.ts";
import {useEffect, useRef, useState} from "react";
import {styled} from "@mui/system";
import {useImmer} from "use-immer";
import {Moment} from "moment";
import {DefaultSearchOption, DefaultSearchProps} from "./types";

const StyledDefaultSearch = styled(Autocomplete, {
    shouldForwardProp: (propName) => propName !== "type"
})<DefaultSearchProps>(() => ({
    "& .MuiOutlinedInput-root": {
        paddingTop: "5px",
        paddingBottom: "5px",
        flexWrap: "nowrap",
        whiteSpace: "nowrap"
    },

    "& .MuiAutocomplete-tag": {
        backgroundColor: "var(--portalseguranca-color-background-dark)",
        borderRadius: "5px",
        // fontSize: "1.05rem",
        color: "var(--portalseguranca-color-text-light)"
    }
}));

function DefaultSearch(props: DefaultSearchProps) {
    // If the defaultFilters prop is present, ensure every key is a valid option
    if (props.defaultFilters) {
        for (const filter of props.defaultFilters) {
            if (!props.options.find(option => option.key === filter.key)) {
                throw new Error(`Key "${filter.key}" is not a valid option`);
            }
        }
    }


    const [options, setOptions] = useState<DefaultSearchOption[]>(props.options)
    const [currentOption, setCurrentOption] = useState<DefaultSearchOption | null>(null);
    const [currentValue, setCurrentValue] = useImmer<{label: string, key: string, value: any, labelValue: string}[]>([]);

    const [calendarAnchorEl, setCalendarAnchorEl] = useState<HTMLElement | null>(null);
    const calendarAnchorRef = useRef<HTMLElement | null>(null);

    const [toCallCallback, setToCallCallback] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);

    const booleanOptions: DefaultSearchOption[] = [
        {label: "Sim", type: "standalone", key: "true"},
        {label: "Não", type: "standalone", key: "false"}
    ]

    const buildComponentValue = (): string[] => {
        const builder: string[] = [];

        for (const item of currentValue) {
            builder.push(`${item.label}: ${item.labelValue}`);
        }

        return builder;
    }

    const triggerCallback = () => {
        // Build the object that will be passed to the callback
        const returnObject: {key: string, value: any}[] = [];
        for (const item of currentValue) {
            returnObject.push({
                key: item.key,
                value: item.value
            })
        }

        props.callback(returnObject);
    }

    const handleOptionCancel = () => {
        // Make sure the options aren't loading
        setLoading(false);

        // Set the options to the default ones
        setOptions(props.options);

        // Set the current option to null
        setCurrentOption(null);

        // Remove the last item from the current value
        setCurrentValue((draft) => {
            draft.pop();
        });
    }

    const handleOptionComplete = (value: any) => {
        if (currentOption === null) return;

        if (currentOption.type === "text") {
            // Return the options to normal
            setOptions(props.options);

            // Set the current option to null
            setCurrentOption(null);

            // * Add the newly created text to the previous item in the current value
            setCurrentValue((draft) => {
                draft[draft.length - 1].value = value;
                draft[draft.length -1].labelValue = value;
            });
        }

        else if (currentOption.type === "date") {
            // Return the options to normal
            setOptions(props.options);

            // Set the current option to null
            setCurrentOption(null);

            // * Add the newly created text to the previous item in the current value
            setCurrentValue((draft) => {
                draft[draft.length - 1].value = (value as Moment).unix();
                draft[draft.length - 1].labelValue = (value as Moment).format("DD-MM-YYYY");
            });
        }

        else if (currentOption.type === "boolean") {
            // Return the options to normal
            setOptions(props.options);

            // Set the current option to null
            setCurrentOption(null);

            // * Add the newly created text to the previous item in the current value
            setCurrentValue((draft) => {
                draft[draft.length - 1].value = (value as DefaultSearchOption).key === "true";
                draft[draft.length -1].labelValue = (value as DefaultSearchOption).key === "true" ? "Sim" : "Não";
            });
        }

        else if (currentOption.type === "option" || currentOption.type === "asyncOption") {
            // Return the options to normal
            setOptions(props.options);

            // Set the current option to null
            setCurrentOption(null);

            // * Add the newly created text to the previous item in the current value
            setCurrentValue((draft) => {
                draft[draft.length - 1].value = (value as DefaultSearchOption).key;
                draft[draft.length - 1].labelValue = (value as DefaultSearchOption).label;
            });
        }

        // After an option is completely selected, call the callback function
        setToCallCallback(true);
    }

    const handleOptionDelete = (optionFullText: string) => {
        // Find in wich index the option is
        const index = currentValue.findIndex((item) => item.label === optionFullText.split(":")[0]);

        // If "currentOption" isn't null and the index is the last one, cancel the option
        if (currentOption !== null && index === currentValue.length - 1) {
            handleOptionCancel();
            return;
        }

        // Set the options to the default ones
        setOptions(props.options);

        // Set the current option to null
        setCurrentOption(null);

        // * Remove the option from the current value

        // Remove the index from the current value
        setCurrentValue((draft) => {
            draft.splice(index, 1);
        });

        // Trigger the callback
        setToCallCallback(true);
    }

    // Ensure options update when needed
    useEffect(() => {
        setOptions(props.options);
    }, [JSON.stringify(props.options)]);

    // Trigger the callback when an option's addition is complete
    useEffect(() => {
        if (toCallCallback) {
            triggerCallback();
            setToCallCallback(false);
        }
    }, [currentValue, toCallCallback]);

    // Apply the default filters when passed to props
    useEffect(() => {
        function clearDefaultFilters() {
            // Delete all filters applied by the default ones
            if (props.defaultFilters) {
                for (const filter of props.defaultFilters) {
                    const newValue = currentValue.filter(value => {
                        return value.key === filter.key && value.value === filter.value;
                    });

                    setCurrentValue(newValue);
                }
            }
        }

        if (props.defaultFilters) {
            // Delete all filters applied by the default ones
            clearDefaultFilters();

            // Loop through the passed filters
            for (const filter of props.defaultFilters) {
                // If this filter is already set, skip it
                if (currentValue.find(val => val.key === filter.key) !== undefined) continue;

                setCurrentValue(draft => {
                    draft.push(filter)
                });
            }

            // Call the callback function to ensure the search is performed
            setToCallCallback(true);
        }

        return () => {
            if (props.defaultFilters) clearDefaultFilters();
        }
    }, [JSON.stringify(props.defaultFilters)]);

    // Call the async function when the current option needs it
    useEffect(() => {
        if (currentOption?.type === "asyncOption") {
            const controller = new AbortController();
            const signal = controller.signal;

            setLoading(true);
            currentOption.optionsFunc(signal).then((options) => {
                setOptions(options.map(option => ({
                    ...option,
                    type: "standalone"
                })));

                setLoading(false);
            }).catch((error: Error) => {
                if (error.name === "AbortError") return;

                console.error(error);
            });

            return () => {
                setLoading(false);
                controller.abort();
            }
        }
    }, [currentOption?.type]);

    return (
        <>
            <StyledDefaultSearch
                multiple
                freeSolo={currentOption && currentOption.type === "text"}
                disableCloseOnSelect
                renderInput={(params) => {
                    return (
                        <DefaultOutlinedTextField
                            alternateColor
                            placeholder={currentValue.length === 0 ? props.placeholder : undefined}
                            // slotProps={{
                            //     input: {
                            //         ...params.InputProps,
                            //         endAdornment: (
                            //             <>
                            //                 <Gate show={loading}>
                            //                     <Loader size={"20px"} />
                            //                 </Gate>
                            //                 {params.InputProps.endAdornment}
                            //             </>
                            //         )
                            //     }
                            // }}
                            {...params}
                        />
                    );
                }}
                value={buildComponentValue()}
                loading={loading}
                loadingText={"A carregar..."}
                noOptionsText={"Sem opções"}
                onChange={(event, value, reason, details) => {
                    console.log(event);
                    console.log(value);
                    console.log(reason);
                    console.log(details);

                    if (!details && reason !== "clear") return; // ? Not sure how to handle this

                    // Handle new input
                    if (reason === "selectOption" || reason === "createOption") {
                        if (currentOption === null) { // New option is getting added
                            // First, make sure an option with the same key isn't already added
                            if (currentValue.find((item) => item.key === (details!.option as DefaultSearchOption).key)) return;

                            // Set the current editing option in state
                            const newOption: DefaultSearchOption = details!.option;
                            setCurrentOption(newOption);

                            // Change the label of the option to appear a ":" at the end, if it's not a standalone option
                            if (newOption.type !== "standalone") {
                                setCurrentValue((draft) => {
                                    draft.push({label: newOption.label, key: newOption.key, value: null, labelValue: ""});
                                });
                            }

                            if (newOption.type === "text") {
                                // Remove all options from autocomplete to let the user type the text
                                setOptions([]);
                            }

                            else if (newOption.type === "date") {
                                // Remove all options from autocomplete to stop a popper from appearing
                                setOptions([]);

                                // Set the anchor for the calendar
                                setCalendarAnchorEl(calendarAnchorRef.current);
                            }

                            else if (newOption.type === "boolean") {
                                setOptions(booleanOptions);
                            }

                            else if (newOption.type === "option") {
                                setOptions(newOption.options.map(option => ({
                                    ...option,
                                    type: "standalone"
                                })));
                            }

                            else if (newOption.type === "asyncOption") {
                                // Remove all options so they can be populated by the async function
                                setOptions([]);
                            }
                        } else { // Just entered a value for an option
                            handleOptionComplete(details!.option);
                        }
                    }

                    // Handle removing options
                    if (reason === "removeOption") {
                        handleOptionDelete(details!.option as string);
                    }

                    // Handle the clear button
                    if (reason === "clear") {
                        // Set the options to the default ones
                        setOptions(props.options);

                        // Set the current option to null
                        setCurrentOption(null);

                        // Clear the current value
                        setCurrentValue([]);

                        // Trigger the callback
                        setToCallCallback(true);
                    }
                }}
                ref={calendarAnchorRef}
                slotProps={{
                    popper: {
                        sx: {
                            "& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading": {
                                color: "var(--portalseguranca-color-text-light)"
                            }
                        }
                    }
                }}
                {...props}
                options={options}
                getOptionDisabled={option => currentValue.find(val => (option as DefaultSearchOption).key === val.key) !== undefined}
            />

            <Popover
                open={currentOption?.type === "date"}
                onClose={() => {
                    setCalendarAnchorEl(null);
                    handleOptionCancel();
                }}
                anchorEl={calendarAnchorEl}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left"
                }}
            >
                <DefaultDateCalendar
                    onChange={(value, selectionState) => {
                        if (selectionState === "finish") {
                            handleOptionComplete(value);
                        }
                    }}
                />
            </Popover>
        </>
    );
}

export default DefaultSearch;