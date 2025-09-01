const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: "*" }));

app.use("/api", require("./routes/user.routes"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
