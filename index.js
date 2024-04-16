const express = require("express");
const cors = require('cors')
const fetch = require('node-fetch');
const grpcClient = require('./grpc/client');
const kafka = require('kafka-node');

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

// Kafka
const client = new kafka.KafkaClient({kafkaHost: 'localhost:9092'});
const producer = new kafka.Producer(client);
producer.on('ready', function() {
  console.log('Kafka Producer is connected and ready.');
});

app.all("/kafka", async (req, res) => {
  const payloads = [
    { topic: 'booking', messages: 'There is new booking', partition: 0 }
  ];
  
  producer.send(payloads, function(error, data) {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Message sent:', data);
    }
  });

  res.json({
    success: true,
    data: "Message sent to Kafka"
  })
});


const port = process.env.APP_PORT || "3001";
app.listen(port, function() {
    console.log('server running on port ' + port + '.');
});