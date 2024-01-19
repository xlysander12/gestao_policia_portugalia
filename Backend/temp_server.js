const express = require('express');
const bodyParser = require("body-parser");
const app = express();

const endpoint = require("./endpoint.js");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/portugalia/gestao_policia", endpoint);


app.listen(8080, () => {
   console.log(__dirname + "\\.env");
   console.log('Server started!');
});
