const express = require('express');
const bodyParser = require("body-parser");
const app = express();

const endpoint = require("./main.js");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/portugalia/portalseguranca", endpoint);


app.listen(8080, () => {
   console.log('Server started!');
});
