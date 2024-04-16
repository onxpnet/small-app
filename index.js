const express = require("express");
const cors = require('cors')
const fetch = require('node-fetch');
const grpcClient = require('./grpc/client');

require("@opentelemetry/api");

const app = express();

app.use(cors());

app.all("/", (req, res) => {
  res.json({ method: req.method, message: "You are accessing Small App", ...req.body });
});

app.all("/process", async (req, res) => {
  try {
    const response = await fetch(process.env.TARGET_URL + "/command" || "http://localhost:3002/command");
    const data = await response.json();
    console.log(data);
  } catch (error) {
      console.error('Error:', error);
  }
});

app.all("/grpc", async (req, res) => {
  try {
    const grpcResp = await grpcClient();
    res.json({
      success: true,
      data: grpcResp
    })
  } catch (error) {
      console.error('Error:', error);
  }
});

const port = process.env.APP_PORT || "3001";
app.listen(port, function() {
    console.log('server running on port ' + port + '.');
});