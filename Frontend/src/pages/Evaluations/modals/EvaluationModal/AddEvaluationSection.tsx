import {ModalSection} from "../../../../components/Modal";
import {
    DefaultButton,
    DefaultOutlinedTextField,
    DefaultSelect,
    DefaultTypography
} from "../../../../components/DefaultComponents";
import {Divider, MenuItem} from "@mui/material";
import { useForceData } from "../../../../hooks";
import {useState} from "react";
import { MinifiedOfficerData } from "@portalseguranca/api-types/officers/output";

type AddEvaluationSectionProps = {
    target: MinifiedOfficerData
    addedFields: number[]
    onAdd: (field: {
        id: number
        grade: number
        comments: string | null
    }) => void
}
function AddEvaluationSection(props: AddEvaluationSectionProps) {
    // Get the force data from the context
    const [forceData] = useForceData();

    // Get the possible fields
    let possibleFields = forceData.evaluation_fields.filter((field) =>
        props.addedFields.indexOf(field.id) === -1 && props.target.patent >= field.starting_patent
    );

    // Store the field data
    const [field, setField] = useState<number>(possibleFields.length > 0 ? possibleFields[0].id : 0);
    const [grade, setGrade] = useState<number>(forceData.evaluation_grades[0].id);
    const [comments, setComments] = useState<string | null>(null);

    return (
        <ModalSection title={"Adicionar Campo de Avaliação"}>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start"
                }}
            >
                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                    Campo de Avaliação:
                </DefaultTypography>
                <DefaultSelect
                    disabled={possibleFields.length === 0}
                    value={field}
                    onChange={(event) => {
                        setField(event.target.value as number);
                    }}
                    sx={{width: "50%", textAlign: "start"}}
                >
                    {possibleFields.map(field => {
                        return (
                            <MenuItem
                                key={`field${field.id}`}
                                value={field.id}
                            >
                                {field.name}
                            </MenuItem>
                        );
                    })}
                </DefaultSelect>

                <Divider flexItem sx={{marginBottom: "5px"}}/>

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                    Avaliação:
                </DefaultTypography>
                <DefaultSelect
                    disabled={possibleFields.length === 0}
                    value={grade}
                    onChange={(event) => {
                        setGrade(event.target.value as number);
                    }}
                    sx={{width: "50%", textAlign: "start"}}
                >
                    {forceData.evaluation_grades.map(grade => {
                        return (
                            <MenuItem
                                key={`grade${grade.id}`}
                                value={grade.id}
                            >
                                {grade.name}
                            </MenuItem>
                        );
                    })}
                </DefaultSelect>

                <Divider flexItem sx={{marginBottom: "5px"}}/>

                <DefaultTypography color={"var(--portalseguranca-color-accent)"} fontWeight={"bold"}>
                    Observações:
                </DefaultTypography>
                <DefaultOutlinedTextField
                    disabled={possibleFields.length === 0}
                    fullWidth
                    multiline
                    placeholder={"Sem observações (recomendado em caso de avaliação negativa)"}
                    value={comments ?? ""}
                    onChange={event => setComments(event.target.value === "" ? null : event.target.value)}
                />

                <Divider flexItem sx={{marginBottom: "5px"}}/>

                <DefaultButton
                    disabled={possibleFields.length === 0}
                    fullWidth
                    buttonColor={"lightgreen"}
                    darkTextOnHover
                    onClick={() => {
                        props.onAdd({
                            id: field,
                            grade,
                            comments
                        });

                        // Re calculate te possible fields and apply it to the selector
                        possibleFields = possibleFields.filter(possible => possible.id !== field);
                        setField(possibleFields.length > 0 ? possibleFields[0].id : 0);

                        // Reset the evaluation selector to the first possible option
                        setGrade(forceData.evaluation_grades[0].id);

                        // Clear all content of the "comments" text field
                        setComments(null);
                    }}
                >
                    Adicionar
                </DefaultButton>
            </div>
        </ModalSection>
    );
}

export default AddEvaluationSection;