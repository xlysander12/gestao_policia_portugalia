import {
    MinifiedOfficerData, OfficerData,
    OfficerImportResponse,
    OfficerImportReturn, OfficerInfoGetResponse
} from "@portalseguranca/api-types/officers/output";
import {Modal, ModalSection} from "../../../components/Modal";
import {useEffect, useState} from "react";
import Gate from "../../../components/Gate/gate.tsx";
import {Loader} from "../../../components/Loader";
import {DefaultButton, DefaultTypography} from "../../../components/DefaultComponents";
import {make_request} from "../../../utils/requests.ts";
import {toast} from "react-toastify";
import OfficerList from "../../../components/OfficerList";

type InnerOfficerImportReturn = Omit<OfficerImportReturn, "import_errors" | "non_present"> & {
    import_errors: MinifiedOfficerData[],
    non_present: MinifiedOfficerData[]
}

type ImportOfficersModalProps = {
    open: boolean;
    onClose: () => void;
}
function ImportOfficersModal({open, onClose}: ImportOfficersModalProps) {
    const [doImport, setDoImport] = useState<boolean | undefined>();

    const [concurrentImport, setConcurrentImport] = useState<boolean>(false);
    const [importOutput, setImportOutput] = useState<InnerOfficerImportReturn | null>(null);

    async function importOfficers() {
        // Inform the user an import is starting
        toast.info("A importar efetivos...");

        // Make the request to import all officers
        const response = await make_request("/officers/import", "POST");

        // If the response is 409, there's already an import ongoing
        if (response.status === 409) {
            setConcurrentImport(true);
            return;
        }

        // Get the JSON from the response
        const output: OfficerImportResponse = await response.json();

        // Check if the response was positive
        if (!response.ok) {
            toast.error(output.message);
            return;
        }

        // For every NIF in the import_errors array, get the officer data
        const import_errors: MinifiedOfficerData[] = [];
        for (const nif of output.data.import_errors) {
            // Get the officer data from the NIF
            const officerResponse = await make_request(`/officers/${nif}`, "GET");

            // If the response isn't 200, create a fake officer data to display the NIF
            if (!officerResponse.ok) {
                import_errors.push({
                    name: "Desconhecido",
                    patent: 0,
                    callsign: "N/A",
                    status: 0,
                    nif
                });
            } else {
                const officerData: OfficerData = await officerResponse.json();
                import_errors.push(officerData);
            }
        }

        // For every NIF in the non_present array, get the officer data
        const non_present: MinifiedOfficerData[] = [];
        for (const nif of output.data.non_present) {
            // Get the officer data from the NIF
            const officerResponse = await make_request(`/officers/${nif}`, "GET");
            const officerResponseJson: OfficerInfoGetResponse = await officerResponse.json();

            // Since this only appears in case an officer is present in the database, the response should always be 200
            // If it isn't, something went really bad
            if (!officerResponse.ok) {
                toast.error(output.message);
                return;
            }

            non_present.push(officerResponseJson.data);
        }

        // Apply the values to the state
        setImportOutput({
            import_errors,
            non_present
        });
        setDoImport(false);
    }

    useEffect(() => {
        if (doImport)
            importOfficers();
    }, [doImport]);

    return (
        <>
            <Modal
                open={open}
                title={"Importar Efetivos"}
                onClose={onClose}
            >
                {/* If there's no output and "doImport" is undefined, no choice has been made yet. Present the choice to start importing */}
                <Gate show={!importOutput && doImport === undefined}>
                    <ModalSection title={"Descrição"}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                justifyContent: "space-around"
                            }}
                        >
                            <DefaultTypography>
                                Vais iniciar o processo de importação de Efetivos.
                            </DefaultTypography>

                            <DefaultTypography>
                                Este processo consiste em importar todos os dados dos efetivos presentes no HUB
                                Geral, independentemente se estão atualizados ou não
                            </DefaultTypography>

                            <DefaultTypography>
                                Antes de iniciar, confirma que todos os dados estão atualizados e prontos a ser
                                importados!
                            </DefaultTypography>
                        </div>
                    </ModalSection>

                    <ModalSection title={"Ações"}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-around",
                                gap: "10px"
                            }}
                        >
                            <DefaultButton
                                buttonColor={"lightgreen"}
                                darkTextOnHover
                                sx={{
                                    flex: 1
                                }}
                                onClick={() => setDoImport(true)}
                            >
                                Importar
                            </DefaultButton>

                            <DefaultButton
                                buttonColor={"red"}
                                sx={{
                                    flex: 1
                                }}
                                onClick={() => onClose()}
                            >
                                Cancelar
                            </DefaultButton>
                        </div>
                    </ModalSection>
                </Gate>

                {/* If there's no output but "doImport" is true, the importing process is ongoing. Show loading */}
                <Gate show={!importOutput && doImport!}>
                    <Loader fullDiv size={"95px"}/>
                </Gate>

                {/* If there's no output but "conurrentInput" is true, an import for this force is already ongoing, therefore, it can't be imported again */}
                <Gate show={!importOutput && concurrentImport}>
                    <DefaultTypography>
                        Já existe uma importação de efetivos em curso!
                    </DefaultTypography>
                </Gate>

                {/* If there's an output, data has already been imported and ready to be shown */}
                <Gate show={importOutput !== null}>
                    <div
                        style={{
                            textAlign: "start"
                        }}
                    >
                        <DefaultTypography>
                            Importação terminada com sucesso!
                        </DefaultTypography>
                    </div>

                    {/* Show Officers that couldn't be imported */}
                    <Gate show={importOutput !== null && importOutput.import_errors.length > 0}>
                        <ModalSection title={"Efetivos que não foram importados"}>
                            <OfficerList
                                disabled
                                invisibleDisabled
                                startingOfficers={importOutput ? importOutput.import_errors: []}
                                changeCallback={() => {}}
                            />
                        </ModalSection>
                    </Gate>

                    {/* Show Officers that aren't present in HUB, but are in the Database */}
                    <Gate show={importOutput !== null && importOutput.non_present.length > 0}>
                        <ModalSection title={"Efetivos presentes no Portal, mas não no HUB"}>
                            <OfficerList
                                disabled
                                invisibleDisabled
                                startingOfficers={importOutput ? importOutput.non_present: []}
                                changeCallback={() => {}}
                            />
                        </ModalSection>
                    </Gate>

                    {/* Show message saying everything was imported successfully */}
                    <Gate show={importOutput !== null && importOutput.import_errors.length === 0 && importOutput.non_present.length === 0}>
                        <ModalSection title={"Importação efetuada com sucesso"}>
                            <DefaultTypography>
                                Todos os efetivos foram importados sem qualquer tipo de erro ou problema
                            </DefaultTypography>
                        </ModalSection>
                    </Gate>
                </Gate>
            </Modal>
        </>
    );
}

export default ImportOfficersModal;