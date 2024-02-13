exports.dbConfigDefaultPSP = {
    host: "mysql.crunchypi.xyz",
    user: "portugalia_gestao_policia",
    password: process.env.MYSQL_PASSWORD,
    database: "portugalia_gestao_psp",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

exports.dbConfigDefaultGNR = {
    host: "mysql.crunchypi.xyz",
    user: "portugalia_gestao_policia",
    password: process.env.MYSQL_PASSWORD,
    database: "portugalia_gestao_gnr",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};