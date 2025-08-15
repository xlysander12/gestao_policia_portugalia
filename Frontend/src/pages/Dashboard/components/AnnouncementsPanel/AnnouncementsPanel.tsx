import ManagementBar from "../../../../components/ManagementBar";
import {DefaultButton, DefaultSearch, DefaultTypography} from "../../../../components/DefaultComponents";
import {useCallback, useContext, useEffect, useState} from "react";
import {AnnouncementsListResponse, MinifiedAnnouncement} from "@portalseguranca/api-types/announcements/output"
import InformationCard from "../../../../components/InformationCard";
import moment from "moment";
import {make_request, RequestMethod} from "../../../../utils/requests.ts";
import {toast} from "react-toastify";
import Gate from "../../../../components/Gate/gate.tsx";
import {Loader} from "../../../../components/Loader";
import cardStyles from "./card.module.css";
import {MinifiedOfficerData, OfficerInfoGetResponse} from "@portalseguranca/api-types/officers/output";
import {PLACEHOLDER_OFFICER_DATA} from "../../../../utils/constants.ts";
import {getObjectFromId} from "../../../../forces-data-context.ts";
import {useForceData, useWebSocketEvent} from "../../../../hooks";
import AnnouncementModal from "./AnnouncementModal.tsx";
import {LoggedUserContext} from "../../../../components/PrivateRoute/logged-user-context.ts";
import {SOCKET_EVENT} from "@portalseguranca/api-types";
import {useParams} from "react-router-dom";

type InnerMinifiedAnnouncement = Omit<MinifiedAnnouncement, "author"> & {
    author: MinifiedOfficerData
}

function AnnouncementsPanel() {
    // Get the announcement_id from URL params
    const {announcement_id} = useParams();

    const [loading, setLoading] = useState<boolean>(true);
    const [currentFilters, setCurrentFilters] = useState<{key: string, value: string}[]>([]);
    const [announcements, setAnnouncements] = useState<InnerMinifiedAnnouncement[]>([]);

    // Force data
    const [_, getForceData] = useForceData();

    // Logged User
    const loggedUser = useContext(LoggedUserContext);

    // Modal Control
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [activeId, setActiveId] = useState<string>();
    const [newEntry, setNewEntry] = useState<boolean>(false);

    async function fetchAnnouncements(showLoading?: boolean, signal?: AbortSignal): Promise<InnerMinifiedAnnouncement[]> {
        if (showLoading) {
            setLoading(true);
        }

        const result = await make_request("/announcements", RequestMethod.GET, {queryParams: currentFilters, signal});
        const resultJson: AnnouncementsListResponse = await result.json();

        if (!result.ok) {
            toast.error(resultJson.message);
            return [];
        }

        // Fetch the author data for each announcement
        const output: InnerMinifiedAnnouncement[] = await Promise.all(
            resultJson.data.map(async announcement => {
                // Fecth the backend
                const authorResponse = await make_request(`/officers/${announcement.author}?patrol=true`, RequestMethod.GET, {signal});
                const authorResponseJson: OfficerInfoGetResponse = await authorResponse.json();

                let authorData: MinifiedOfficerData;

                if (!authorResponse.ok) {
                    authorData = PLACEHOLDER_OFFICER_DATA.minified
                } else {
                    authorData = authorResponseJson.data
                }

                return {
                    ...announcement,
                    author: authorData
                }
            }
        ));

        if (showLoading) {
            setLoading(false);
        }

        return output;
    }

    // Listen to Socket Events
    useWebSocketEvent(SOCKET_EVENT.ANNOUNCEMENTS, useCallback(async () => {
        const list = await fetchAnnouncements(false);

        setAnnouncements(list);
    }, [JSON.stringify(currentFilters)]));

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        async function exec() {
            const list = await fetchAnnouncements(true, signal);

            setAnnouncements(list);
        }

        void exec();

        return () => {
            controller.abort();
        }
    }, [JSON.stringify(currentFilters)]);

    // Whenever the "announcement_id" changes, open the Announcement Modal and display the information
    useEffect(() => {
        if (announcement_id) {
            setActiveId(announcement_id);
            setNewEntry(false);
            setModalOpen(true);
        }

        return () => {
            setActiveId(undefined);
            setModalOpen(false);
        }
    }, [announcement_id]);

    return (
        <>
            <ManagementBar>
                <div
                    style={{
                        boxSizing: "border-box",
                        width: "100%"
                    }}
                >
                    <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>Pesquisa:</DefaultTypography>
                    <div
                        style={{
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "10px",
                            width: "100%"
                        }}
                    >
                        {/*TODO: Free-entered strings must be read as tags and search by them*/}
                        <DefaultSearch
                            size={"small"}
                            freeSolo
                            freeKey={"tags"}
                            fullWidth
                            options={[
                                {
                                    type: "boolean",
                                    label: "Ativo",
                                    key: "active"
                                }
                            ]}
                            defaultFilters={[
                                {
                                    key: "active",
                                    value: true,
                                    label: "Ativo",
                                    labelValue: "Sim"
                                }
                            ]}
                            callback={(options) => {
                                setCurrentFilters(options);
                            }}
                            sx={{
                                flex: 1
                            }}
                        />
                        <Gate show={loggedUser.intents.announcements}>
                            <DefaultButton
                                onClick={() => {
                                    setActiveId(undefined);
                                    setNewEntry(true);
                                    setModalOpen(true);
                                }}
                                sx={{flex: 0.3}}
                            >
                                Novo
                            </DefaultButton>
                        </Gate>
                    </div>
                </div>
            </ManagementBar>

            <div
                style={{
                    boxSizing: "border-box",
                    height: "calc(100% - (5.4rem + 10px))",
                    marginTop: "10px",
                    padding: "0-7rem"
                }}
            >
                <Gate show={loading}>
                    <Loader fullDiv />
                </Gate>

                <Gate show={!loading}>
                    <Gate show={announcements.length === 0}>
                        <div style={{
                                textAlign: "center"
                            }}
                        >
                            <DefaultTypography fontSize={"x-large"} color={"var(--portalseguranca-color-text-dark)"}>Sem resultados</DefaultTypography>
                        </div>

                    </Gate>

                    {announcements.map(announcement => {
                        return (
                            <InformationCard
                                key={`announcement#${announcement.id}`}
                                statusColor={announcement.expiration === null || announcement.expiration > moment().unix() ? "rgb(0, 255, 0)" : "grey"}
                                callback={() => {
                                    setNewEntry(false);
                                    setActiveId(announcement.id);
                                    setModalOpen(true);
                                }}
                            >
                                <div
                                    className={cardStyles.main}
                                >
                                    <div className={cardStyles.left}>
                                        <DefaultTypography fontSize={"large"}>{announcement.title}</DefaultTypography>
                                        <DefaultTypography fontSize={"small"} color={"gray"}>
                                            {getObjectFromId(announcement.author.patent, getForceData(announcement.author.force ?? localStorage.getItem("force")!).patents)!.name} {announcement.author.name}
                                        </DefaultTypography>
                                    </div>
                                    <div className={cardStyles.right}>
                                        <DefaultTypography fontSize={"small"} color={"gray"}>{moment.unix(announcement.created).calendar()}</DefaultTypography>
                                        <Gate show={announcement.expiration !== null}>
                                            <DefaultTypography fontSize={"small"} color={"gray"}>Expira: {moment.unix(announcement.expiration ?? moment().unix()).format("DD/MM/YYYY")}</DefaultTypography>
                                        </Gate>
                                    </div>
                                </div>
                            </InformationCard>
                        );
                    })}
                </Gate>
            </div>

            <AnnouncementModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                id={activeId}
                newEntry={newEntry}
            />
        </>
    );
}

export default AnnouncementsPanel;