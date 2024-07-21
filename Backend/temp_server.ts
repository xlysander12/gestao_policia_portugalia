import express from 'express';
import bodyParser from "body-parser";
const app = express();

import endpoint from "./src";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/portugalia/portalseguranca", endpoint);


app.listen(8080, () => {
   console.log('Server started!');
});
