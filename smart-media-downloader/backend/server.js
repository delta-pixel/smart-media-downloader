const express = require("express");
const cors = require("cors");
const path = require("path");

const downloadRoute =
  require("./routes/download");

const app =
  express();


app.use(cors());

app.use(
  express.json()
);


// ==========================================
// FRONTEND
// ==========================================

app.use(
  express.static(
    path.join(
      __dirname,
      "../frontend"
    )
  )
);


// ==========================================
// API
// ==========================================

app.use(
  "/api",
  downloadRoute
);


// ==========================================
// SERVER
// ==========================================

app.listen(
  3000,
  () => {

    console.log(
      "🚀 Server running at http://localhost:3000"
    );

  }
);