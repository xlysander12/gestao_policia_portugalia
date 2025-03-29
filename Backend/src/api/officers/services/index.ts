import {DefaultReturn, InnerOfficerData} from "../../../types";
import {RouteFilterType} from "../../routes";
import {
    addOfficer,
    eraseOfficer,
    fireOfficer,
    getNextAvailableCallsign, getOfficerData,
    getOfficersList,
    reHireOfficer,
    updateOfficer
} from "../repository";
import {MinifiedOfficerData} from "@portalseguranca/api-types/officers/output";
import {
    getForceDefaultPatents,
    getForceHubDetails, getForceHubPropertyPosition,
    getForcePromotionExpression,
    isHubRowReadable
} from "../../../utils/config-handler";
import {UpdateOfficerRequestBody} from "@portalseguranca/api-types/officers/input";
import {getForcePatents, getForceStatuses} from "../../util/repository";
import {ReceivedQueryParams} from "../../../utils/filters";
import {PatentData} from "@portalseguranca/api-types/util/output";
import {InnerPatrolData} from "../../../types/inner-types";
import {getOfficerPatrol} from "../../patrols/repository";
import {getSheetValues} from "../../../utils/google-sheets";

export function sortOfficers(officers: InnerOfficerData[]): InnerOfficerData[] {
    // Sort the officers by patent from highest to lowest and, if the patent is the same, by callsign from lowest to highest
    return officers.sort((a, b) => {
        if (a.patent === b.patent) {
            // If the patents are the same, strip all non-numerical characters from the callsigns and compare them as numbers
            let aCallsign = a.callsign.replace(/\D-/g, '');
            let bCallsign = b.callsign.replace(/\D-/g, '');

            return parseInt(aCallsign) - parseInt(bCallsign);
        }

        return b.patent - a.patent;
    });
}

export async function listOfficers(force: string, routeValidFilters: RouteFilterType, filters: ReceivedQueryParams): Promise<DefaultReturn<MinifiedOfficerData[]>> {

    // Fetch the list from the database
    let officerList = await getOfficersList(force, routeValidFilters, filters);

    // Return the list
    return {result: true, status: 200, message: "Operação concluida com sucesso", data: officerList};
}

export async function hireOfficer(name: string, phone: number, iban: string, nif: number, kms: number, discord: number, steam: string,
                                  recruit: boolean,
                                  force: string, targetOfficer: InnerOfficerData | null, isTargetOfficerFormer: boolean, overwrite: boolean): Promise<DefaultReturn<void>> { // TODO: There must be a way to manually set the entry date

    // First, check if the nif is already in use, either by an active or former officer
    if (targetOfficer !== null) {
        // Then check if it is an active officer
        if (!isTargetOfficerFormer) {
            // If it is, return a 409 status code
            return {result: false, status: 409, message: "Já existe um efetivo com esse NIF."};
        }

        // Since it's not an active officer, make sure the "overwrite" query param is present or false
        // If it's not present, or its value is false, return a 409 status code
        if (!overwrite) {
            return {result: false, status: 409, message: "Já existe um antigo efetivo com esse NIF."};
        }
    }

    // * Since this request is now validated, we can proceed to add the new officer
    // Delete all previous data of the officer
    if (targetOfficer !== null) {
        await eraseOfficer(nif, force);
    }

    // Checking if the patent will be a recruit or not
    let patent = recruit ? getForceDefaultPatents(force).recruit: getForceDefaultPatents(force).default;

    // * Calculating what the new callsign will be, if it's not a recruit
    let callsign = null
    if (patent === getForceDefaultPatents(force).default) {
        // Get the leading char of the patent of the new officer
        let leading_char = ((await getForcePatents(force, patent))! as PatentData).leading_char;

        callsign = await getNextAvailableCallsign(leading_char, force);
    }

    // Inserting the new officer into the database
    await addOfficer(name, patent, callsign, phone, nif, iban, kms, discord, steam, force);

    // If everything went according to plan, return a 200 status code
    return {result: true, status: 201, message: "Efetivo contratado com sucesso."};
}

export async function restoreOfficer(officer: InnerOfficerData, force: string): Promise<DefaultReturn<void>> {
    // Make sure this officer is, indeed, a former officer
    if (!officer.isFormer) {
        return {result: false, status: 409, message: "Este efetivo já é ativo na força."};
    }

    // * Get the new officer's callsign
    // Get the leading char of the patent of the new officer
    let leading_char = ((await getForcePatents(force, getForceDefaultPatents(force).default))! as PatentData).leading_char;

    let callsign = await getNextAvailableCallsign(leading_char, force);

    // Call the repository to restore the officer
    await reHireOfficer(officer.nif, force, callsign);

    // After all is complete, return a 200 status code
    return {result: true, status: 200, message: "Efetivo restaurado com sucesso."};
}

export async function alterOfficer(nif: number, force: string, currentInfo: InnerOfficerData, changes: UpdateOfficerRequestBody, loggedOfficer: InnerOfficerData): Promise<DefaultReturn<void>> {
    const validFields = ["name", "patent", "callsign", "status", "entry_date", "promotion_date", "phone", "iban", "kms", "discord", "steam"];

    // * An User cannot alter the information about an Officer with higher patent than them
    if (currentInfo.patent >= loggedOfficer.patent) {
        return {result: false, status: 403, message: "Não tens permissão para alterar este efetivo."};
    }

    // * Figure out if this change is considered a promotion
    // Get the expression from the config file
    let isPromotionExpression: string = getForcePromotionExpression(force);

    // Alter all possible variables in the expression string
    for (const field of validFields) {
        isPromotionExpression = isPromotionExpression.replaceAll(`$old${field}`, currentInfo[field as keyof InnerOfficerData] as string);
        isPromotionExpression = isPromotionExpression.replaceAll(`$new${field}`, changes[field as keyof UpdateOfficerRequestBody] !== undefined ? changes[field as keyof UpdateOfficerRequestBody] as string : currentInfo[field as keyof InnerOfficerData] as string);
    }

    // Evaluate the expression
    let isPromotion = eval(isPromotionExpression);

    // Call the repository to update the Officer
    await updateOfficer(nif, force, changes, isPromotion);

    // After all is complete, return a 200 status code
    return {result: true, status: 200, message: "Efetivo editado com sucesso."};
}

export async function deleteOfficer(force: string, targetOfficer: InnerOfficerData, loggedOfficer: InnerOfficerData, reason?: string): Promise<DefaultReturn<void>> {
    // Making sure the requesting user is higher patent the requested officer
    if (targetOfficer.patent >= loggedOfficer.patent) {
        return {result: false, status: 403, message: "Não tens permissão para despedir este efetivo."};
    }

    // After making sure the officer can be fired, run the SQL procedure to transfer the data to the archive db
    await fireOfficer(targetOfficer.nif, force, reason);

    // If everything went according to plan, return a 200 status code
    return {result: true, status: 200, message: "Efetivo despedido com sucesso."};
}

export async function officerPatrol(force: string, officerNif: number): Promise<DefaultReturn<InnerPatrolData>> {
    // Call the repository to get the patrol
    let result = await getOfficerPatrol(force, officerNif);

    if (result === null) {
        return {result: false, status: 404, message: "Este efetivo não está em patrulha."};
    }

    // Return the result
    return {result: true, status: 200, message: "Operação concluida com sucesso", data: result};
}

async function convertHubValues(force: string, patent: string, status: string, entry_date: string, promotion_date: string, phone: string, kms: string, discord: string, nif?: string) {
    // Convert Patent
    const outPatent = ((await getForcePatents(force)) as PatentData[]).find((existingPatent) => existingPatent.name === patent);

    // Convert status
    const outStatus = (await getForceStatuses(force)).find((existingStatus) => existingStatus.name === status);

    // Convert the entry date
    // This date is in the DD/MM/YYYY format
    let entry_date_split = entry_date.split("/");
    const outEntry_date = Date.parse(`${entry_date_split[2]}-${entry_date_split[1]}-${entry_date_split[0]}`);

    // Convert the promotion date
    // This date is in the DD/MM/YYYY format
    let promotion_date_split = promotion_date.split("/");
    const outPromotion_date = Date.parse(`${promotion_date_split[2]}-${promotion_date_split[1]}-${promotion_date_split[0]}`);

    // Convert the phone number
    const outPhone = String(phone).replace(/\D/g, ''); // Remove all non-numeric characters

    // Convert the KMs
    const outKms = kms.replace(/\D/g, ''); // Remove all non-numeric characters

    // Convert the discord
    const outDiscord = discord.replace(/\D/g, ''); // Remove all non-numeric characters

    // Convert nif, if present
    let outNif;
    if (nif) {
        outNif = nif.replace(/\D/g, '');
    }

    return {
        patent: outPatent,
        status: outStatus,
        entry_date: outEntry_date,
        promotion_date: outPromotion_date,
        phone: outPhone,
        kms: outKms,
        discord: outDiscord,
        nif: outNif
    }
}

async function updateOfficerFromHub(force: string, nif: number, row: any[]): Promise<boolean> {
    // * First, convert values to the correct types
    const {patent, status, entry_date, promotion_date, phone, kms, discord} = await convertHubValues(force,
        row[getForceHubPropertyPosition(force, "patent")!],
        row[getForceHubPropertyPosition(force, "status")!],
        row[getForceHubPropertyPosition(force, "entry_date")!],
        row[getForceHubPropertyPosition(force, "promotion_date")!],
        row[getForceHubPropertyPosition(force, "phone")!],
        row[getForceHubPropertyPosition(force, "kms")!],
        row[getForceHubPropertyPosition(force, "discord")!]
    );

    try {
        await updateOfficer(nif, force, {
            name: row[getForceHubPropertyPosition(force, "name")!],
            patent: patent ? patent.id : undefined,
            callsign: row[getForceHubPropertyPosition(force, "callsign")!],
            status: status ? status.id : undefined,
            entry_date,
            promotion_date,
            phone: phone === "" || isNaN(parseInt(phone)) ? parseInt(phone) : undefined,
            iban: row[getForceHubPropertyPosition(force, "iban")!],
            kms: kms !== "" && !isNaN(parseInt(kms)) ? parseInt(kms) : undefined,
            discord: discord === "" || isNaN(parseInt(discord)) ? parseInt(discord): undefined
        }, false);

        return true;
    } catch (e) {
        return false;
    }

}

async function addOfficerFromHub(force: string, row: any[]): Promise<[boolean, number]> {
    const {patent, status, entry_date, promotion_date, phone, kms, discord, nif} = await convertHubValues(force,
        row[getForceHubPropertyPosition(force, "patent")!],
        row[getForceHubPropertyPosition(force, "status")!],
        row[getForceHubPropertyPosition(force, "entry_date")!],
        row[getForceHubPropertyPosition(force, "promotion_date")!],
        row[getForceHubPropertyPosition(force, "phone")!],
        row[getForceHubPropertyPosition(force, "kms")!],
        row[getForceHubPropertyPosition(force, "discord")!],
        row[getForceHubPropertyPosition(force, "nif")!]
    );

    try {
        await addOfficer(
            row[getForceHubPropertyPosition(force, "name")!],
            patent ? patent.id : getForceDefaultPatents(force).default,
            row[getForceHubPropertyPosition(force, "callsign")!],
            phone ? parseInt(phone) : 0,
            parseInt(nif!),
            row[getForceHubPropertyPosition(force, "iban")!],
            kms ? parseInt(kms) : 0,
            discord ? parseInt(discord) : 0,
            "steam:0",
            force
        )

        // After adding the officer, update the entry_date and status with the correct value
        if (entry_date || promotion_date || status) {
            await updateOfficer(parseInt(nif!), force, {
                entry_date,
                promotion_date,
                status: status?.id
            }, false);
        }

        return [true, parseInt(nif!)];
    } catch (e) {
        return [false, parseInt(nif!)];
    }


}

const importing_forces: {[force: string]: boolean} = {}

export async function importOfficers(force: string): Promise<DefaultReturn<{import_errors: number[], non_present: number[]}>> {
    // Check if this force is not already importing
    if (importing_forces[force]) {
        return {result: false, status: 409, message: "Esta força já está a importar efetivos."};
    }

    // Set this force as importing
    importing_forces[force] = true;

    // * Get the all data from the Force's HUB on Google Sheets
    // Fecth the spreadsheet id and sheet name from the config file
    if (!getForceHubDetails(force)) { // If there's no HUB information present, this is not supported for this force
        return {result: false, status: 422, message: "Esta rota não é suportada por esta força."};
    }

    const {id, sheet} = getForceHubDetails(force)!;

    const rows = await getSheetValues(id, sheet);

    // If no rows are present, return a 404 status code
    if (!rows) {
        return {result: false, status: 404, message: "Não foram encontrados dados para importar."};
    }

    // * Iterate over every row in the sheet and apply it to the database
    const import_errors: number[] = []; // Store the nifs of officers that couldn't be imported

    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];

        // If the index of the row doesn't match any of the patents' ranges, skip it
        if (!isHubRowReadable(force, index)) {
            continue;
        }

        // Since the row is a valid one, fetch the NIF out of it
        let nif: string = row[getForceHubPropertyPosition(force, "nif")!]

        // Remove any non-numeric characters from the NIF
        nif = nif.replace(/\D/g, '');

        // If the NIF is an empty string or anything other than a number, skip this row
        if (nif === "" || isNaN(parseInt(nif))) {
            continue;
        }

        // Check if the Officer is already in the database
        const officerData = await getOfficerData(parseInt(nif), force);

        // If the officer is already in the database, update it with the values from the row
        if (officerData) {
            if (!(await updateOfficerFromHub(force, parseInt(nif), row))) {
                import_errors.push(officerData.nif);
            }
        } else {
            // Check if the officer is present as a former one
            const formerOfficerData = await getOfficerData(parseInt(nif), force, true);

            // If the officer is present as a former one, set his fired flag to false and update the values
            if (formerOfficerData) {
                await restoreOfficer(formerOfficerData, force);

                if (!(await updateOfficerFromHub(force, parseInt(nif), row))) {
                    import_errors.push(formerOfficerData.nif);
                }

            } else { // If it's not present in the database, add it
                const [result, nif] = await addOfficerFromHub(force, row);
                if (!result) {
                    import_errors.push(nif);
                }
            }
        }
    }

    // * After all rows from the google sheets are processed, check if there are any officers in the database that are not present in the google sheets
    // Fetch all officers from the database
    const officers = await getOfficersList(force);

    // Filter out the officers that are not present in the google sheets
    const non_present = officers.filter((officer) => !rows.find((row, index) => {
        if (!isHubRowReadable(force, index)) {
            return false;
        }

        let nif = row[getForceHubPropertyPosition(force, "nif")!].replace(/\D/g, '');
        return officer.nif === parseInt(nif);
    }));

    // Set the force as not importing anymore
    importing_forces[force] = false;

    return {
        result: true,
        status: 200,
        message: "Efetivos importados com sucesso.",
        data: {
            import_errors,
            non_present: non_present.map(officer => officer.nif)
        }
    }
}