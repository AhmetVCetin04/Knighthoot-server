const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) =>
        {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader(
                        'Access-Control-Allow-Headers',
                        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
                );
                res.setHeader(
                        'Access-Control-Allow-Methods',
                        'GET, POST, PATCH, DELETE, OPTIONS'
                );
                next();
        });
app.listen(5173); // start Node + Express server on port 5173


const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.8';
const client = new MongoClient(url);
client.connect();
const db = client.db('Knighthoot'); // everything in 1 db
const Teachers = db.collection('Teachers');
const Scores = db.collection('Scores');
const Students = db.collection('Students');
const Tests = db.collection('Tests');




cardList = ['test']


app.post('/api/email', async (req, res, next) =>
{
    //incoming: email




});

app.post('/api/addcard', async (req, res, next) =>
    {
    // incoming: userId, color
    // outgoing: error
    const { userId, card } = req.body;
    const newCard = {Card:card,UserId:userId};
    var error = '';

    try
    {
        const result = Tests.insertOne(newCard);
    }
    catch(e)
    {
        error = e.toString();
    }
    cardList.push( card );
    var ret = { error: error };
    res.status(200).json(ret);
});


app.post('/api/login', async (req, res, next) =>
    {
    // incoming: login, password
    // outgoing: id, firstName, lastName, error
    var error = '';
    const { username, password } = req.body;

    /**
     *
     *
     *
     * inserting into collection:
     * db.collectionName.insertOne (or insertMany)
     *
     * db.Tests.insertOne({ TID: 0, ID: 123, questions: [{ question: "whats 2+2?", answer: 2, options: ["1", "2", "3", "4"] }] })
     * db.Teachers.insertOne({ ID: 0, firstName: "John", lastName: "Doe", username: "johndoe123", password: "123", email: "johndoe123@gmail.com" })
     * db.Scores.insertOne({ID:2,SID:3,correct:2,incorrect:4,testID:123})
     * db.Students.insertOne({ ID: 3, firstName: "Jimmy", lastName: "Doe", username: "jimmydoe123", password: "123", email: "jimmydoe123@gmail.com" })
     */

    /*
    4 collections: (like tables in nosql)

    Scores
    Students
    Teachers
    Tests
    */

    let results = await Teachers.find({username:username,password:password}).toArray();


    if(results.length == 0){ // if no matching teacher, search students
        results = await Students.find({username:username,password:password}).toArray();
    }

    var id = -1;
    var fn = '';
    var ln = '';
    var email = '';

    if(results.length > 0 )
    {
    id = results[0];
    fn = results[1];
    ln = results[2];
    email = results[5];
    }
    var ret = { id:id, firstName:fn, lastName:ln, email:email, error:''};
    res.status(200).json(ret);
});

app.post('/api/register', async (req, res) => {
    const { firstName, lastName, username, password, email, isTeacher } = req.body;

    if (typeof isTeacher !== 'boolean') {
        return res.status(400).json({ error: 'isTeacher boolean field is required.' });
    }
    if (!firstName || !lastName || !username || !password || !email) {
         return res.status(400).json({ error: 'Missing required fields (firstName, lastName, username, password, email).' });
    }

    try {
        let collectionToUse;
        let userType;
        let nextId;

        if (isTeacher) {
            collectionToUse = Teachers;
            userType = 'Teacher';
        } else {
            collectionToUse = Students;
            userType = 'Student';
        }

        const lastUser = await collectionToUse.find().sort({ ID: -1 }).limit(1).toArray();

        if (lastUser.length === 0) {
            nextId = 1;
        } else {
            nextId = lastUser[0].ID + 1;
        }

        const existingUser = await collectionToUse.findOne({ $or: [{ username: username }, { email: email }] });
        if (existingUser) {
            return res.status(400).json({ error: `${userType} username or email already exists.` });
        }

        const newUser = {
            ID: nextId,
            firstName,
            lastName,
            username,
            password,
            email
        };

        const result = await collectionToUse.insertOne(newUser);
        if (result.insertedId) {
            const userResponse = { ...newUser };
            delete userResponse.password;
            res.status(201).json({ user: userResponse, message: `${userType} created successfully.` });
        } else {
            res.status(500).json({ error: `Failed to create ${userType}.` });
        }

    } catch (e) {
        console.error("Registration error:", e);
        res.status(500).json({ error: 'An internal server error occurred during registration.' });
    }
});

app.post('/api/searchcards', async (req, res, next) =>
        {
        // incoming: userId, search
        // outgoing: results[], error
        var error = '';
        const { userId, search } = req.body;
        var _search = search.trim();
        const results = await db.collection('Tests').find({"Card":{$regex:_search+'.*', $options:'i'}}).toArray();
        var _ret = [];
        for( var i=0; i<results.length; i++ ) {
                _ret.push( results[i].Card );
        }
        var ret = {results:_ret, error:error};
        res.status(200).json(ret);
});

app.post('/api/nextquestion', async(req, res, next) =>
        {
        // okay this is kinda fucked so listen up boys and girls...
        // We need a way to keep track of which question the students are answering
        // The best way to do this is to use a singular source of truth, in this case that would be whichever question the teacher is on
        // But the student answer api then can only return a single value (the student answer for the current question, we cant rely on the students phone as a source of info)
        // simple solution is as such
        // teacher displays question 1
        // student states are (0,0) where the first 0 represents right answers, and the second 0 represents wrong answers
        // now some students submit answers, some are right and their score state is updated to (1,0), some are wrong and their score state is updated to (0,1), and some dont answer, still retaining
        // a score of (0,0)
        // now teacher decides to move on to question 2, here is what we do...
        // for each student, add up the number of right and wrong answers. If the sum of answers is less than the value of the current question - 1, we need to increment the wrong answer value by 1.
        // ie. (1,0) stays (1,0) since 1+0 !< 2 -1, (0,1) stays (0,1) since 0+1 !< 2-1, but (0,0) becomes (0,1) since 0+0 < 2-1
        // essentially this ensures that we can use the number of teacher 'nextquestion' calls as the source of truth for which question the students are answering
        var error = '';
        const { teacherID, testID, } = req.body;});
