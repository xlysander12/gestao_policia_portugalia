import {
    Announcement,
    AnnouncementInfoResponse,
    ExistingAnnouncementSocket
} from "@portalseguranca/api-types/announcements/output";
import {CreateAnnouncementBody, EditAnnouncementBody} from "@portalseguranca/api-types/announcements/input";
import {useForceData, useWebSocketEvent} from "../../../../hooks";
import {useCallback, useContext, useEffect, useState} from "react";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import moment from "moment";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import {ConfirmationDialog, Modal, ModalSection} from "../../../../components/Modal";
import Gate from "../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../components/Loader";
import {DefaultButton, DefaultDateTimePicker, DefaultTextField, DefaultTypography} from "../../../../components/DefaultComponents";
import {ForcesDataContext, getObjectFromId} from "../../../../forces-data-context.ts";
import {Autocomplete, Divider} from "@mui/material";
import {useImmer} from "use-immer";
import {
    MenuButtonBlockquote,
    MenuButtonBold,
    MenuButtonBulletedList,
    MenuButtonCode,
    MenuButtonCodeBlock,
    MenuButtonItalic,
    MenuButtonOrderedList, MenuButtonRedo,
    MenuButtonStrikethrough,
    MenuButtonUnderline,
    MenuButtonUndo,
    MenuControlsContainer,
    MenuDivider,
    MenuSelectHeading,
    RichTextEditor
} from "mui-tiptap";
import StarterKit from "@tiptap/starter-kit";
import {BaseResponse, SOCKET_EVENT} from "@portalseguranca/api-types";


type InnerAnnouncement = Omit<Announcement, "author" | "id"> & {
    id: number
    force: string
    author: MinifiedOfficerData
}


function splitID(stringId: string): [string, number] {
    const result = /([a-z]+)(\d+)$/.exec(stringId);

    return [result![1], parseInt(result![2])]
}

type AnnoucencementModalProps = {
    open: boolean,
    onClose: () => void,
    id?: string,
    newEntry?: boolean
}
function AnnouncementModal(props: AnnoucencementModalProps) {
    // * Get Force Data
    // Get forces list
    const forces = Object.keys(useContext(ForcesDataContext));
    const [_, getForceData] = useForceData();

    // Get logged user from context
    const loggedUser = useContext(LoggedUserContext);

    const [loading, setLoading] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<boolean>(false);

    // Deletion confirmation
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState<boolean>(false);

    const DEFAULT_ANNOUNCEMENT_DATA: InnerAnnouncement = {
        id: 0,
        force: localStorage.getItem("force")!,
        author: {
            name: loggedUser.info.personal.name,
            patent: loggedUser.info.professional.patent.id,
            callsign: loggedUser.info.professional.callsign,
            status: loggedUser.info.professional.status.id,
            nif: loggedUser.info.personal.nif,
            force: localStorage.getItem("force")!
        },
        forces: [],
        tags: [],
        created: moment().unix(),
        expiration: null,
        title: "",
        body: "",

    }

    const [announcementData, setAnnouncementData] = useImmer<InnerAnnouncement>(DEFAULT_ANNOUNCEMENT_DATA);

    async function fetchAnnouncement(showLoading = true, signal?: AbortSignal ) {
        if (showLoading) setLoading(true);

        const response = await make_request(`/announcements/${props.id}`, RequestMethod.GET, {signal});
        const responseJson: AnnouncementInfoResponse = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            props.onClose();
            return;
        }

        // Get the data of the author
        const authorResponse = await make_request(`/officers/${responseJson.data.author}?patrol=true`, RequestMethod.GET, {signal});
        const authorResponseJson = await authorResponse.json() as OfficerInfoGetResponse;

        if (!authorResponse.ok) {
            toast.error(authorResponseJson.message);
            return;
        }

        // Apply data to the state
        setAnnouncementData({
            ...responseJson.data,
            id: splitID(responseJson.data.id)[1],
            force: splitID(responseJson.data.id)[0],
            author: authorResponseJson.data
        });

        setLoading(false);
    }

    async function editAnnouncement() {
        // Set the loading to true
        setLoading(true);

        // Make the request
        const response = await make_request<EditAnnouncementBody>(`/announcements/${props.id}`, RequestMethod.PATCH, {
            body: {
                body: announcementData.body,
                tags: announcementData.tags,
                expiration: announcementData.expiration,
                forces: announcementData.forces,
                title: announcementData.title
            }
        });
        const responseJson: BaseResponse = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }

        // If the edit went OK, reload the data
        toast.success("Anúncio editado com sucesso");
        setEditMode(false);

        void fetchAnnouncement();
    }

    async function createAnnouncement() {
        // Set the loading flag to true
        setLoading(true);

        // Make the request
        const response = await make_request<CreateAnnouncementBody>("/announcements", RequestMethod.POST, {
           body: {
               body: announcementData.body,
               expiration: announcementData.expiration,
               forces: announcementData.forces,
               tags: announcementData.tags,
               title: announcementData.title
           }
        });
        const responseJson: BaseResponse = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }

        // If it worked, close the modal
        toast.success("Anúncio Criado com sucesso");
        props.onClose();
    }

    async function deleteAnnouncement() {
        // Set the loading flag to true
        setLoading(true);

        // Make the request
        const response = await make_request(`/announcements/${props.id}`, RequestMethod.DELETE);
        const responseJson = await response.json();

        if (!response.ok) {
            toast.error(responseJson.message);
            setLoading(false);
            return;
        }

        // If the deletion went ok, close the modal
        toast.success("Anúncio apagado com sucesso");
        props.onClose();
    }

    // Socket events
    useWebSocketEvent<ExistingAnnouncementSocket>(SOCKET_EVENT.ANNOUNCEMENTS, useCallback(async (data) => {
        // If the modal isn't open, ignore the event
        if (!props.open) return;

        // If the modal is in "newEntry" mode, ignore the event
        if (props.newEntry) return;

        // If the action was the addition of a new announcement, ignore the event
        if (data.action === "add") return;

        // If the event wasn't related to the current announcement, ignore it
        if (`${data.force}${data.id}` !== props.id) return;

        // If the event was triggered by the current user, ignore it
        if (data.by === loggedUser.info.personal.nif) return;

        // If the announcement just got deleted, close the modal and inform
        if (data.action === "delete") {
            toast.warning("O Anúncio que estavas a visualizar foi apagado");
            props.onClose();
            return;
        }

        // If the announcement was updated, fetch the new data
        if (data.action === "update" && !editMode) {
            await fetchAnnouncement(true);
            toast.warning("O Anúncio que estavas a visualizar foi atualizado");
            return;
        }
    }, [props.open, props.newEntry, props.id, loggedUser.info.personal.nif]));

    // If the modal is open and
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        if (props.open && !props.newEntry) {
            void fetchAnnouncement(true, signal);
        }

        if (props.open && props.newEntry) {
            setAnnouncementData(DEFAULT_ANNOUNCEMENT_DATA);
            setEditMode(true);
        }

        return () => {
            controller.abort();
            setAnnouncementData(DEFAULT_ANNOUNCEMENT_DATA);
            setLoading(false);
            setEditMode(false);
        }

    }, [props.id, props.open, props.newEntry]);

    return (
        <>
            <Modal
                open={props.open}
                onClose={props.onClose}
                title={props.newEntry ? "Novo Anúncio" : `Anúncio #${props.id?.toUpperCase()}`}
                width={"70%"}
            >
                <Gate show={loading}>
                    <Loader fullDiv />
                </Gate>

                <Gate show={!loading}>
                    <ModalSection title={"Detalhes"}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column"
                            }}
                        >
                            <Gate show={!props.newEntry}>
                                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Author:</DefaultTypography>
                                <DefaultTypography>{getObjectFromId(announcementData.author.patent, getForceData(announcementData.force).patents)!.name} {announcementData.author.name}</DefaultTypography>

                                <Divider sx={{marginBottom: "5px"}}/>
                            </Gate>

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Forças:</DefaultTypography>
                            <Autocomplete
                                disabled={!editMode}
                                multiple
                                options={forces}
                                getOptionLabel={(option) => {
                                    return option.toUpperCase();
                                }}
                                value={[announcementData.force, ...announcementData.forces]}
                                onChange={(_event, value) => {
                                    setAnnouncementData(draft => {
                                        draft.forces = value.filter(force => force !== announcementData.force)
                                    })
                                }}
                                renderInput={(params) => {
                                    return (<DefaultTextField textWhenDisabled {...params} />)
                                }}
                                sx={{
                                    "& .MuiSvgIcon-root": {
                                        color: "var(--portalseguranca-color-accent)"
                                    },

                                    "& .MuiAutocomplete-tag": {
                                        backgroundColor: "rgba(10, 10, 10, 0.4)",
                                        borderRadius: "5px",
                                        color: "var(--portalseguranca-color-text-light)",

                                        "&.Mui-disabled": {
                                            opacity: 1
                                        },

                                        "&.Mui-disabled .MuiSvgIcon-root": {
                                            display: "none"
                                        }
                                    },
                                }}
                            />

                            <Divider sx={{marginBottom: "5px"}}/>

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Tags:</DefaultTypography>
                            <Autocomplete
                                freeSolo
                                multiple
                                disabled={!editMode}
                                options={[]}
                                value={announcementData.tags}
                                onChange={(_event, value) => {
                                    setAnnouncementData(draft => {
                                        draft.tags = value
                                    })
                                }}
                                renderInput={(params) => {
                                    return (<DefaultTextField textWhenDisabled {...params} />)
                                }}
                                sx={{
                                    "& .MuiSvgIcon-root": {
                                        color: "var(--portalseguranca-color-accent)"
                                    },

                                    "& .MuiAutocomplete-tag": {
                                        backgroundColor: "rgba(10, 10, 10, 0.4)",
                                        borderRadius: "5px",
                                        color: "var(--portalseguranca-color-text-light)",

                                        "&.Mui-disabled": {
                                            opacity: 1
                                        },

                                        "&.Mui-disabled .MuiSvgIcon-root": {
                                            display: "none"
                                        }
                                    },
                                }}
                            />

                            <Divider sx={{marginBottom: "5px"}}/>

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Expira em:</DefaultTypography>
                            <DefaultDateTimePicker
                                disabled={!editMode}
                                textWhenDisabled
                                clearable
                                value={announcementData.expiration !== null ? moment.unix(announcementData.expiration) : null}
                                onChange={(value) => {
                                    setAnnouncementData(draft => {
                                        draft.expiration = value ? value.unix() : null;
                                    });
                                }}
                            />

                            <Divider sx={{marginBottom: "5px"}}/>

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Título:</DefaultTypography>
                            <DefaultTextField
                                fullWidth
                                disabled={!editMode}
                                textWhenDisabled
                                value={announcementData.title}
                                onChange={(event) => {
                                    setAnnouncementData(draft => {
                                        draft.title = event.target.value;
                                    });
                                }}
                            />
                            <Divider sx={{marginBottom: "5px"}}/>

                            <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Texto:</DefaultTypography>
                            <RichTextEditor
                                // @ts-expect-error - I don't know
                                extensions={[StarterKit]}
                                RichTextFieldProps={{
                                    MenuBarProps: {
                                        hide: !editMode
                                    }
                                }}
                                renderControls={() => (
                                    <MenuControlsContainer>
                                        <MenuSelectHeading />

                                        <MenuDivider />

                                        <MenuButtonBold />
                                        <MenuButtonItalic />
                                        <MenuButtonUnderline />
                                        <MenuButtonStrikethrough />

                                        <MenuDivider />

                                        <MenuButtonOrderedList />
                                        <MenuButtonBulletedList />

                                        <MenuDivider />

                                        <MenuButtonBlockquote />

                                        <MenuDivider />

                                        <MenuButtonCode />
                                        <MenuButtonCodeBlock />

                                        <MenuDivider />

                                        <MenuButtonUndo />
                                        <MenuButtonRedo />
                                    </MenuControlsContainer>
                                )}
                                editable={editMode}
                                content={announcementData.body}
                                onUpdate={(event) => {
                                    setAnnouncementData(draft => {
                                        draft.body = event.editor.getHTML();
                                    });
                                }}
                                sx={{
                                    "& .MuiCollapse-wrapper" : {
                                        backgroundColor: "var(--portalseguranca-color-background-dark)"
                                    },
                                    "& .MuiToggleButton-root" : {
                                        color: "var(--portalseguranca-color-text-light)",

                                        "&.Mui-selected": {
                                            color: "var(--portalseguranca-color-accent)"
                                        }
                                    },

                                    "& .MuiOutlinedInput-root": {
                                        color: "var(--portalseguranca-color-text-light)"
                                    },

                                    "& .MuiSelect-icon": {
                                        color: "var(--portalseguranca-color-text-light)"
                                    }
                                }}
                            />
                        </div>
                    </ModalSection>

                    {/*Only show the actions tab if the logged user has the announcements intent*/}
                    <Gate show={loggedUser.intents.announcements}>
                        <ModalSection title={"Ações"}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: "10px"
                                }}
                            >
                                <Gate show={!editMode && !props.newEntry}>
                                    <DefaultButton
                                        onClick={() => setEditMode(true)}
                                        sx={{
                                            flex: 1
                                        }}
                                    >
                                        Editar
                                    </DefaultButton>

                                    <DefaultButton
                                        onClick={() => {setDeleteConfirmationOpen(true)}}
                                        buttonColor={"red"}
                                        sx={{flex: 1}}
                                    >
                                        Apagar
                                    </DefaultButton>
                                </Gate>

                                <Gate show={editMode && !props.newEntry}>
                                    <DefaultButton
                                        buttonColor={"lightgreen"}
                                        darkTextOnHover
                                        onClick={editAnnouncement}
                                        sx={{
                                            flex: 1
                                        }}
                                    >
                                        Guardar
                                    </DefaultButton>

                                    <DefaultButton
                                        buttonColor={"red"}
                                        onClick={() => {
                                            setEditMode(false);
                                            void fetchAnnouncement(true);
                                        }}
                                        sx={{flex: 1}}
                                    >
                                        Cancelar
                                    </DefaultButton>
                                </Gate>

                                <Gate show={!!props.newEntry}>
                                    <DefaultButton
                                        buttonColor={"lightgreen"}
                                        darkTextOnHover
                                        onClick={createAnnouncement}
                                        sx={{
                                            flex: 1
                                        }}
                                    >
                                        Criar Anúncio
                                    </DefaultButton>
                                </Gate>
                            </div>
                        </ModalSection>
                    </Gate>
                </Gate>
            </Modal>

            <ConfirmationDialog
                open={deleteConfirmationOpen}
                title={`Apagar Anúncio #${announcementData.force.toUpperCase()}${announcementData.id}`}
                text={"Tens a certeza que queres apagar este Anúncio?\nEsta ação não pode ser revertida!"}
                onConfirm={deleteAnnouncement}
                onDeny={() => setDeleteConfirmationOpen(false)}
            />
        </>
    );
}

export default AnnouncementModal;