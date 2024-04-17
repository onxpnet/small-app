const express = require("express");
const cors = require('cors')
const fetch = require('node-fetch');
const grpcClient = require('./grpc/client');
const kafka = require('kafka-node');
const CircuitBreaker = require('opossum');
const rateLimit = require('express-rate-limit');

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
bullQueue.on('error', (error) => {
  console.error('Error in the queue:', error);
});

app.all("/bull", async (req, res) => {
  bullQueue.add({
    payment: 'There is new payment'
  });

  res.json({
    success: true,
    data: "Message is queued on bull"
  });
});

// circuit breaker
// function wrapped with circuit breaker
async function notfoundRequest(payload) {
  await fetch(process.env.TARGET_URL + "/notfound" || "http://localhost:3002/notfound");
}

const breaker = new CircuitBreaker(notfoundRequest, {
  timeout: 3000, // // If our function takes longer than 3 seconds, trigger a failure
  resetTimeout: 30000, // After 30 seconds, try again.
  maxFailures: 3 // When we hit 3 failures, trip the circuit
  // When 50% of requests fail, trip the circuit
  // errorThresholdPercentage: 50,
});

// Use the circuit breaker to send a message to Kafka
app.all("/breaker", async (req, res) => {
  breaker.fire({
    checkout: "There is new checkout event"
  })
    .then(console.log)
    .catch(console.error);
  res.json({
    success: true,
    data: "Message is processed"
  });
});

// rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5 // limit each IP to 5 requests per windowMs
});

app.all("/limit", limiter, async (req, res) => {
  res.json({
    success: true,
    data: "Message is not limited, yet!"
  });
});


const port = process.env.APP_PORT || "3001";
app.listen(port, function() {
    console.log('server running on port ' + port + '.');
});