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
const kafkaClient = new kafka.KafkaClient({kafkaHost: 'localhost:9092'});
const kafkaProducer = new kafka.Producer(kafkaClient);
kafkaProducer.on('ready', function() {
  console.log('Kafka Producer is connected and ready.');
});

app.all("/kafka", async (req, res) => {
  const payloads = [
    { topic: 'booking', messages: 'There is new booking', partition: 0 }
  ];
  
  kafkaProducer.send(payloads, function(error, data) {
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

// bull
const Queue = require('bull');

// Create a Redis queue
const bullQueue = new Queue('payment', 'redis://127.0.0.1:6379');

bullQueue.add({
  payment: 'There is new payment'
});

bullQueue.on('error', (error) => {
  console.error('Error in the queue:', error);
});


const port = process.env.APP_PORT || "3001";
app.listen(port, function() {
    console.log('server running on port ' + port + '.');
});