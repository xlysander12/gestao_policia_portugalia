import { Knex } from "knex";
import { hash } from 'bcrypt';
import { PASSWORD_SALT_ROUNDS } from "../src/utils/constants";

type OfficerSeed = {
    name: string;
    patent: number;
    callsign: string;
    status: number;
    phone: number;
    nif: number;
    iban: string;
    discord: string;
};

type UserSeed = {
    nif: number;
    password: string;
    password_login: number;
    discord_login: number;
    suspended: number;
};

type UserIntent = {
    name: string;
    description: string;
}

const FIRST_NAMES = [
    "Ramiro", "Joao", "Miguel", "Andre", "Tiago", "Bruno", "Rui", "Hugo", "Paulo", "Duarte",
    "Ines", "Marta", "Sofia", "Beatriz", "Carla", "Ana", "Mariana", "Joana", "Filipa", "Catarina"
];

const LAST_NAMES = [
    "Flores", "Silva", "Santos", "Pereira", "Costa", "Oliveira", "Ferreira", "Rodrigues", "Almeida", "Sousa",
    "Gomes", "Carvalho", "Rocha", "Martins", "Mendes", "Ribeiro", "Teixeira", "Barros", "Nunes", "Lopes"
];

const CALLSIGN_LETTERS: Record<number, string> = {
    1: "G", 2: "G", 3: "G",
    4: "Z", 5: "Z", 6: "Z",
    7: "D", 8: "D", 9: "D",
    10: "T", 11: "T", 12: "T", 13: "T", 14: "T", 15: "T",
    16: "F", 17: "F", 18: "F"
};

const intents: UserIntent[] = [
    { name: "accounts", description: "Pode criar e alterar permissões de outros usuários" },
    { name: "activity", description: "Pode criar registos de atividade  (horas semanais / última picagem) e aceitar / recusar pedidos de inatividade" },
    { name: "announcements", description: "Pode criar, modificar e apagar anúncios gerais da força" },
    { name: "evaluations", description: "Pode consultar todas as avaliações feitas de um efetivo / sobre um efetivo, exceto de efetivos superiores ao mesmo" },
    { name: "events", description: "Pode editar e apagar qualquer evento pertencente à força" },
    { name: "officers", description: "Pode contratar, despedir e alterar as informações de outros efetivos" },
    { name: "patrols", description: "Pode editar os dados de qualquer patrulha" }
];

const specialUnits = [
    { id: 1, name: "Unidade Nacional de Trânsito", acronym: "UNT", description: null },
    { id: 2, name: "Equipas de Investigação Criminal", acronym: "EIC", description: null },
    { id: 3, name: "Unidade de Segurança e Honras do Estado", acronym: "USHE", description: null },
    { id: 4, name: "Unidade Aérea", acronym: "UA", description: null },
    { id: 5, name: "Unidade de Emergência de Proteção e Socorro", acronym: "UEPS", description: null },
    { id: 6, name: "Destacamento de Intervenção", acronym: "DI", description: null },
    { id: 7, name: "Grupo de Intervenção Cinotécnico", acronym: "GIC", description: null },
    { id: 8, name: "Grupo de Intervenção de Ordem Pública", acronym: "GIOP", description: null },
    { id: 9, name: "Grupo de Intervenção de Operações Especiais", acronym: "GIOE", description: null },
    { id: 10, name: "Unidade de Intervenção", acronym: "UI", description: null }
];

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(values: T[]): T {
    return values[randomInt(0, values.length - 1)];
}

async function generateRandomOfficersAndUsers(count: number, startingNif = 1000000): Promise<{ officers: OfficerSeed[]; users: UserSeed[] }> {
    const officers: OfficerSeed[] = [];
    const users: UserSeed[] = [];

    for (let i = 0; i < count; i++) {
        const nif = startingNif + i;
        const patent = randomInt(1, 17);
        const callsignLetter = CALLSIGN_LETTERS[patent] ?? "G";
        const callsign = `${callsignLetter}-${String((i % 99) + 1).padStart(2, "0")}`;
        const phone = 910000001 + i;
        const iban = `PT${String(100000 + i).slice(-6)}`;
        const discord = `1000000000000${String(i).padStart(4, "0")}`;
        const name = `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;

        officers.push({
            name,
            patent,
            callsign,
            status: randomInt(1, 5),
            phone,
            nif,
            iban,
            discord
        });

        users.push({
            nif,
            password: await hash("default", PASSWORD_SALT_ROUNDS),
            password_login: 1,
            discord_login: 1,
            suspended: 0
        });
    }

    return { officers, users };
}

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("users").del();
    await knex("patrols").del();
    await knex("officers").del();
    await knex("evaluation_decisions").del();
    await knex("evaluation_grades").del();
    await knex("evaluation_fields").del();
    await knex("patents").del();
    await knex("patent_categories").del();
    await knex("status").del();
    await knex("special_units").del();
    await knex("event_types").del();
    await knex("intents").del();
    await knex("patrols_types").del();
    await knex("inactivity_types").del();
    await knex("specialunits_roles").del();

    // Inserts seed entries
    await knex('patent_categories').insert([
        { id: 1, name: "Guarda" },
        { id: 2, name: "Sargento" },
        { id: 3, name: "Oficial" },
        { id: 4, name: "1º Oficial" },
        { id: 5, name: "Direção" }
    ]);
    await knex('patents').insert([
        { id: 1, name: "Guarda", category: 1, max_evaluation: -2, leading_char: "G" },
        { id: 2, name: "Guarda Principal", category: 1, max_evaluation: -2, leading_char: "G" },
        { id: 3, name: "Cabo", category: 1, max_evaluation: -2, leading_char: "G" },
        { id: 4, name: "Furriel", category: 2, max_evaluation: 3, leading_char: "Z" },
        { id: 5, name: "2º Sargento", category: 2, max_evaluation: 3, leading_char: "Z" },
        { id: 6, name: "1º Sargento", category: 2, max_evaluation: 3, leading_char: "Z" },
        { id: 7, name: "Alferes", category: 3, max_evaluation: 6, leading_char: "D" },
        { id: 8, name: "Tenente", category: 3, max_evaluation: 6, leading_char: "D" },
        { id: 9, name: "Capitão", category: 3, max_evaluation: 8, leading_char: "D" },
        { id: 10, name: "Major", category: 3, max_evaluation: 9, leading_char: "T" },
        { id: 11, name: "Coronel", category: 4, max_evaluation: 10, leading_char: "T" },
        { id: 12, name: "Brigadeiro General", category: 4, max_evaluation: 11, leading_char: "T" },
        { id: 13, name: "Major General", category: 4, max_evaluation: 12, leading_char: "T" },
        { id: 14, name: "Tenente General", category: 4, max_evaluation: 13, leading_char: "T" },
        { id: 15, name: "Comandante Geral", category: 4, max_evaluation: 14, leading_char: "T" },
        { id: 16, name: "Subdiretor Nacional", category: 5, max_evaluation: 15, leading_char: "F" },
        { id: 17, name: "Diretor Nacional Adjunto", category: 5, max_evaluation: 16, leading_char: "F" },
        { id: 18, name: "Diretor Nacional", category: 5, max_evaluation: 17, leading_char: "F" }
    ]);
    await knex('status').insert([
        { id: 1, name: "Suspenso", color: "#cc0000", can_patrol: true },
        { id: 2, name: "Inativo", color: "#ff0000", can_patrol: true },
        { id: 3, name: "Formação", color: "#bf9000", can_patrol: true },
        { id: 4, name: "Provisório", color: "#f1c232", can_patrol: true },
        { id: 5, name: "Ativo", color: "#01ff00", can_patrol: true }
    ]);
    await knex('special_units').insert(specialUnits);
    await knex('intents').insert(intents);
    await knex('event_types').insert([
        { id: 1, name: "Cerimónia de Subidas", variant: "ceremony", intent: "evaluations" },
        { id: 2, name: "Unidade Especial", variant: "special_unit", intent: null },
        { id: 3, name: "Evento Personalizado", variant: "custom", intent: null }
    ]);
    if (process.env.NODE_ENV === 'development') {
        const { officers, users } = await generateRandomOfficersAndUsers(25, 1111111);
        await knex('officers').insert(officers);
        await knex("users").insert(users);
    }
    await knex('officers').insert([
        { name: `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`, patent: 18, callsign: "F-00", status: 5, phone: 910000000, nif: 1000001, iban: 'PT0000001', discord: "20000000000000000" }
    ]);
    await knex("users").insert([
        { nif: 1000001, password: await hash("default", PASSWORD_SALT_ROUNDS), password_login: 1, discord_login: 1, suspended: 0 }
    ]);
    await knex("user_intents").insert(intents.map((intent) => { return ({ user: 1000001, intent: intent.name, enabled: true }) }))
    await knex("evaluation_decisions").insert([
        { id: 1, name: "Despedir", color: "#852222" },
        { id: 2, name: "Atribuição de Punição", color: "#ee0909" },
        { id: 3, name: "Descer", color: "#ff0000" },
        { id: 4, name: "A ponderar", color: "#5a3286" },
        { id: 5, name: "Manter", color: "#e8d22e" },
        { id: 6, name: "Saída de Provisório", color: "#0a53a8" },
        { id: 7, name: "Subir", color: "#7cff20" },
        { id: 8, name: "Subir 2 Cargos", color: "#385623" }
    ]);
    await knex("evaluation_fields").insert([
        { id: 1, name: "Postura", starting_patent: 1 },
        { id: 2, name: "Comunicações", starting_patent: 1 },
        { id: 3, name: "Atitude", starting_patent: 1 },
        { id: 4, name: "Abordagens", starting_patent: 1 },
        { id: 5, name: "Conhecimentos", starting_patent: 1 },
        { id: 6, name: "Responsabilidade", starting_patent: 3 },
        { id: 7, name: "Formação", starting_patent: 4 },
        { id: 8, name: "Negociação", starting_patent: 4 },
        { id: 9, name: "Coordenação", starting_patent: 6 },
        { id: 10, name: "Autonomia", starting_patent: 6 }
    ]);
    await knex("evaluation_grades").insert([
        { id: 1, name: "Melhorar Bastante", color: "#ff0000" },
        { id: 2, name: "Melhorar", color: "#ffff00" },
        { id: 3, name: "Aceitável", color: "#92d050" },
        { id: 4, name: "Bom", color: "#70ad47" },
        { id: 5, name: "Muito Bom", color: "#385623" }
    ]);
    await knex("patrols_types").insert([
        { id: 1, name: "Patrulha Normal", special: false },
        { id: 2, name: "Patrulha Motard", special: false },
        { id: 3, name: "Descaracterizado", special: false },
        { id: 4, name: "Unidade Especial", special: true }
    ]);
    await knex("inactivity_types").insert([
        {
            id: 1,
            name: "Inatividade",
            description: "Requisitos de Atividade:\r\n- Entrar de serviço, no mínimo, 1 vez a cada 5 dias;\r\n- Fazer, no mínimo, 5 horas num período de 7 dias (normalmente, de sexta-feira a sexta-feira).\r\n\r\nCom Inatividade, um Agente não pode comparecer, de todo, em serviço, até à data de fim estipulada ou, em caso de Inatividade Indeterminada, até ter aprovação de um Comandante.",
            color: "#fc0404",
            status: 2
        },
        {
            id: 2,
            name: "Atividade Diminuída",
            description: "Requisitos de Atividade:\r\n- Entrar de serviço, no mínimo, 1 vez a cada 5 dias;\r\n- Fazer, no mínimo, 5 horas num período de 7 dias (normalmente, de sexta-feira a sexta-feira).\r\n\r\nCom Atividade Diminuída, um Agente pode não cumprir um dos requisitos mencionados, no entanto, é assim obrigado a cumprir o outro.\r\nCaso isto não se verifique, há legitimidade para despedimento.",
            color: "#ffe599",
            status: null
        }
    ]);
    await knex("last_ceremony").insert([{ date: new Date().toJSON().slice(0, 10) }]);
    await knex('specialunits_roles').insert([
        { id: 1, name: "Comandante" },
        { id: 2, name: "Sub-Comandante" },
        { id: 3, name: "Membro" }
    ]);
};
