const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: "*" }));

// signup

app.use("/api", require("./Routes/mainRoutes"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
