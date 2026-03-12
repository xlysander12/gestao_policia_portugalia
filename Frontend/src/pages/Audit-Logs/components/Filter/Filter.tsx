import ManagementBar from "../../../../components/ManagementBar";
import {
    DefaultDatePicker,
    DefaultSelect,
    DefaultTextField,
    DefaultTypography
} from "../../../../components/DefaultComponents";
import styles from "./styles.module.css";
import {useImmer} from "use-immer";
import moment from "moment";
import {useEffect, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {Divider, IconButton, MenuItem, Skeleton} from "@mui/material";
import {OfficerPickerModal} from "../../../../components/OfficerPicker";
import OfficerIdentificationText from "../../../../components/OfficerIdentificationText/OfficerIdentificationText.tsx";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import Gate from "../../../../components/Gate/gate.tsx";
import ClearIcon from "@mui/icons-material/Clear";
import {TRANSLATED_ACTIONS, TRANSLATED_MODULES} from "../../constants.ts";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import { toast } from "react-toastify";

function Filter() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [officerPickerModalOpen, setOfficerPickerModalOpen] = useState<boolean>(false);
    const [selectedAuthor, setSelectedAuthor] = useState<MinifiedOfficerData | null>(null);

    const [loadingAuthor, setLoadingAuthor] = useState<boolean>(false);

    function buildFiltersFromQuery() {
        const filters: {[key: string]: string} = {};

        searchParams.forEach((value, key) => {
            filters[key] = value;
        });

        return filters;
    }

    const [filters, setFilters] = useImmer<{[key: string]: string}>(buildFiltersFromQuery());

    async function getOfficerData(nif: number, signal?: AbortSignal) {
        setLoadingAuthor(true);

        const response = await make_request(`/officers/${nif}`, RequestMethod.GET, {signal});
        const responseJson = await response.json() as OfficerInfoGetResponse;

        if (!response.ok) {
            toast.error(responseJson.message);
            setSelectedAuthor(null);
        } else {
            setSelectedAuthor(responseJson.data);
            setLoadingAuthor(false);
        }
    }

    useEffect(() => {
        setFilters(buildFiltersFromQuery());
    }, [searchParams.toString()]);

    useEffect(() => {
        const controller = new AbortController();

        if (searchParams.get("author") !== null && (selectedAuthor === null || selectedAuthor.nif !== parseInt(searchParams.get("author")!))) {
            void getOfficerData(parseInt(searchParams.get("author")!), controller.signal);
        }

        return () => controller.abort();
    }, [searchParams.get("author")]);

    return (
        <>
            <ManagementBar>
                <DefaultTypography fontSize={"larger"}>Filtrar Registos</DefaultTypography>
            </ManagementBar>

            <div className={styles.main}>
                <div className={styles.sideBySide}>
                    <div>
                        <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Antes de:</DefaultTypography>
                        <DefaultDatePicker
                            disableFuture
                            clearable
                            value={filters["before"] ? moment.unix(parseInt(filters["before"])) : null}
                            onChange={value => {
                                if (value === null || !value.isValid()) {
                                    setSearchParams(params => {
                                        params.delete("before");
                                        return params;
                                    });
                                } else {
                                    setSearchParams(params => {
                                        params.set("before", value.unix().toString());
                                        return params;
                                    });
                                }
                            }}
                        />
                    </div>

                    <div>
                        <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Depois de:</DefaultTypography>
                        <DefaultDatePicker
                            disableFuture
                            clearable
                            value={filters["after"] ? moment.unix(parseInt(filters["after"])) : null}
                            onChange={value => {
                                if (value === null || !value.isValid()) {
                                    setSearchParams(params => {
                                        params.delete("after");
                                        return params;
                                    });
                                } else {
                                    setSearchParams(params => {
                                        params.set("after", value.unix().toString());
                                        return params;
                                    });
                                }
                            }}
                        />
                    </div>
                </div>

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Autor:</DefaultTypography>
                <Gate show={loadingAuthor}>
                    <Skeleton variant={"text"} width={"100%"}/>
                </Gate>

                <Gate show={!loadingAuthor && selectedAuthor === null}>
                    <DefaultTypography
                        clickable
                        onClick={() => setOfficerPickerModalOpen(true)}
                    >
                        Selecionar autor...
                    </DefaultTypography>
                </Gate>
                <Gate show={!loadingAuthor && selectedAuthor !== null}>
                    <div className={styles.sideBySide}>
                        <OfficerIdentificationText officer={selectedAuthor!} />
                        <IconButton
                            onClick={() => setSearchParams(params => {
                                params.delete("author");
                                setSelectedAuthor(null);
                                return params;
                            })}
                        >
                            <ClearIcon sx={{color: "red"}}/>
                        </IconButton>
                    </div>

                </Gate>

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Módulo:</DefaultTypography>
                <div className={styles.sideBySide}>
                    <DefaultSelect
                        fullWidth
                        value={searchParams.get("module") || "null"}
                        onChange={event => {
                            if (event.target.value === "null") {
                                setSearchParams(params => {
                                    params.delete("module");
                                    return params;
                                });
                                return;
                            }

                            setSearchParams(params => {
                                params.set("module", event.target.value as string);
                                return params;
                            });
                        }}
                    >
                        {Object.keys(TRANSLATED_MODULES).map(mod => {
                            return (
                                <MenuItem
                                    key={`module#${mod}`}
                                    value={mod}
                                >
                                    {TRANSLATED_MODULES[mod]}
                                </MenuItem>
                            );
                        })}
                    </DefaultSelect>

                    <IconButton
                        onClick={() => setSearchParams(params => {
                            params.delete("module");
                            return params;
                        })}
                    >
                        <ClearIcon sx={{color: "red"}}/>
                    </IconButton>
                </div>

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Ação:</DefaultTypography>
                <div className={styles.sideBySide}>
                    <DefaultSelect
                        fullWidth
                        value={searchParams.get("action")}
                        onChange={event => {
                            if (event.target.value === "null") {
                                setSearchParams(params => {
                                    params.delete("action");
                                    return params;
                                });
                                return;
                            }

                            setSearchParams(params => {
                                params.set("action", event.target.value as string);
                                return params;
                            });
                        }}
                    >
                        {Object.keys(TRANSLATED_ACTIONS).map(action => {
                            return (
                                <MenuItem
                                    key={`action#${action}`}
                                    value={action}
                                >
                                    {TRANSLATED_ACTIONS[action]}
                                </MenuItem>
                            );
                        })}
                    </DefaultSelect>

                    <IconButton
                        onClick={() => setSearchParams(params => {
                            params.delete("action");
                            return params;
                        })}
                    >
                        <ClearIcon sx={{color: "red"}}/>
                    </IconButton>
                </div>

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Tipo:</DefaultTypography>
                <DefaultTextField
                    fullWidth
                    value={searchParams.get("type")}
                    onChange={event => {
                        setSearchParams(params => {
                            if (event.target.value === "") {
                                params.delete("type");
                                return params;
                            }

                            params.set("type", event.target.value);
                            return params;
                        });
                    }}
                />

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Alvo:</DefaultTypography>
                <DefaultTextField
                    fullWidth
                    value={searchParams.get("target")}
                    type={"number"}
                    onChange={event => {
                        setSearchParams(params => {
                            if (event.target.value === "") {
                                params.delete("target");
                                return params;
                            }

                            params.set("target", event.target.value);
                            return params;
                        });
                    }}
                />

                <Divider flexItem sx={{margin: "5px 0 10px 0"}} />

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Código de Resposta:</DefaultTypography>
                <DefaultTextField
                    fullWidth
                    value={searchParams.get("code")}
                    type={"number"}
                    onChange={event => {
                        setSearchParams(params => {
                            if (event.target.value === "") {
                                params.delete("code");
                                return params;
                            }

                            params.set("code", event.target.value);
                            return params;
                        });
                    }}
                />
            </div>

            <OfficerPickerModal
                open={officerPickerModalOpen}
                onClose={() => setOfficerPickerModalOpen(false)}
                callback={(officer) => {
                    setOfficerPickerModalOpen(false);
                    setSelectedAuthor(officer);
                    setSearchParams(params => {
                        params.set("author", officer.nif.toString());
                        return params;
                    });
                }}
            />
        </>
    );
}

export default Filter;