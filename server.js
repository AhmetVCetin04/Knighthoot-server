require("dotenv").config()

const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const auth = require("./middleware/auth");

// --- Database Connection ---
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.8';
const client = new MongoClient(url);

let db; // Make db accessible after connection
let Teachers;
let Scores;
let Students;
let Tests;

// Connect to MongoDB and define collections
async function connectDB() {
    try {
        await client.connect();
        console.log("Successfully connected to MongoDB!");
        db = client.db('Knighthoot'); // Assign db instance
        Teachers = db.collection('Teachers');
        Scores = db.collection('Scores');
        Students = db.collection('Students');
        Tests = db.collection('Tests');
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1); // Exit if connection fails
    }
}

// Call connectDB to establish connection before starting server
connectDB();

// --- Require the API handler files ---
const handleLogin = require('./api/login.js');
const handleRegister = require('./api/register.js');
const handleEmail = require('./api/email.js');
const checkEmailExists = require('./api/emailExists.js');
const handleWaitQuestion = require('./api/waitQuestion.js');
const handleNextQuestion = require('./api/nextQuestion.js');
const handleSubmitQuestion = require('./api/submitQuestion.js');
const handleCreateTest = require('./api/createTest.js');
const handleJoinTest = require('./api/joinTest.js');
const handleReadTest = require('./api/readTest.js');
const handleStartTest = require('./api/startTest.js');
const handleUpdateTest = require('./api/updateTest.js');
const handleDeleteTest = require('./api/deleteTest.js');
const handleGetStudentScores = require('./api/getStudentScores.js');
const handleEndTest = require('./api/endTest.js');
const handleDuplicateTest = require('./api/duplicateTest.js');
const handleSearchScoresByTest = require('./api/searchScoresByTest.js');
const handleForgotPassword = require('./api/forgotPassword.js');
const handleResetPassword = require('./api/resetPassword.js');
const handleDeleteAccount = require('./api/deleteAccount.js');

if (process.env.NODE_ENV === "test") {
        console.log = () => {};
        console.error = () => {};
}

// Middleware to check if DB is ready before handling requests
app.use((req, res, next) => {
    if (!db) {
        return res.status(503).json({ error: "Database not connected yet. Please try again shortly." });
    }
    next();
});

// --- CORS Headers (Handled by app.use(cors()) at top) ---

// --- Define API Routes using imported handlers ---
app.post('/api/login' ,(req, res) => {
    handleLogin(req, res, Teachers, Students);
});

app.post('/api/resetPassword' ,(req, res) => {
    handleResetPassword(req, res, Teachers, Students);
});


app.post('/api/deleteAccount' ,(req, res) => {
    handleDeleteAccount(req, res, Teachers, Students);
});



app.post('/api/joinTest', auth, (req, res) => {
        handleJoinTest(req, res, Tests, Scores);
});


app.post('/api/startTest', auth, (req, res) => {
        handleStartTest(req, res, Tests);
});

app.post('/api/endTest', auth, (req, res) => {
        handleEndTest(req, res, Tests);
});



// Duplicates removed, functionality handled by /api/test routes below

app.post('/api/submitQuestion', auth, (req, res) => {
        handleSubmitQuestion(req, res, Tests,Scores);
});

app.post('/api/waitQuestion', auth, (req, res) => {
        handleWaitQuestion(req, res, Tests);
});

app.post('/api/register', (req, res) => {
    handleRegister(req, res, Teachers, Students);
});

app.post('/api/email', (req, res) => {
    // Pass Teachers and Students as handleEmail checks these collections
    handleEmail(req, res, Teachers, Students); // Fixed: Added missing arguments
});

app.post('/api/emailExists', (req, res) => {
    // Pass Teachers and Students as handleEmail checks these collections
    checkEmailExists(req, res, Teachers, Students);
});

app.post('/api/nextQuestion', auth, (req, res) => {
    handleNextQuestion(req, res, db);
});
app.post('/api/forgot-password', (req, res) => { 
    handleForgotPassword(req, res, Teachers, Students);
});

app.post('/api/reset-password', (req, res) => {  
    handleResetPassword(req, res, Teachers, Students);
});

app.delete('/api/account/delete', auth, (req, res) => {
	handleDeleteAccount(req, res, Teachers, Students);
});

// --- Test CRUD Routes ---
app.post('/api/test', auth, (req, res) => {
    handleCreateTest(req, res, Tests);
});

app.get('/api/test', auth, (req, res) => {
    handleReadTest(req, res, Tests);
});
app.get('/api/test/:testId', auth, (req, res) => {
    handleReadTest(req, res, Tests);
});
app.get('/api/score/test/:testId', auth, (req, res) => {
    handleSearchScoresByTest(req, res, Scores, Students);
});
app.put('/api/test/:testId', auth, (req, res) => {
    handleUpdateTest(req, res, Tests);
});

app.delete('/api/test/:testId', auth, (req, res) => {
    handleDeleteTest(req, res, Tests);
});
app.post('/api/test/duplicate', auth, (req, res) => {
NT:
    handleDuplicateTest(req, res, Tests);
});
app.get('/api/score/student/:studentId', auth, (req, res) => {
    handleGetStudentScores(req, res, Scores);
});

var options = {
    key: fs.readFileSync('./private.key'),
    cert: fs.readFileSync('./certificate.crt'),
};

// --- Start Server ---
// Fixed: Changed port to 5173 to avoid conflict with frontend
//
var server = https.createServer(options, app).listen(5173, function(){
  console.log("Express server listening on port 5173");
});

/*
app.listen(5173, '0.0.0.0', () => {
    console.log('Server listening on port 5173');
}); //'0.0.0.0' added for mobile compatibility

*/
