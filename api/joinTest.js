// File: api/joinTest.js

async function handleJoinTest(req, res, Tests, Scores) {
// takes the student id (int)  and the pin number (string, 4 digit pin)
// returns the current question so question (string) and options (array of strings)
    const { ID, PIN } = req.body;

    const test = await Tests.findOne({PIN:PIN});

        if (!test) {
            return res.status(400).json({ error: "WRONG PIN" });
        }

        if(!test.isLive){
                return res.status(400).json({error:"Test is not live"});
        }

        // Check if student has already joined this test to prevent duplicate score entries
        const existingScore = await Scores.findOne({ SID: ID, testID: test.ID });

        if (!existingScore) { // Only insert if no existing score for this student/test combo
            const result = await Scores.insertOne(
                {
                    SID: ID, 
                    testID: test.ID,
                    correct: 0,
                    incorrect: 0,
                    totalQuestions: test.questions.length
                });

            // Changed from 'if (result.modifiedCount === 0)' to check for insertedId
            if (!result.insertedId) {
                return res.status(500).json({ error: `Failed to create new score.` });
            }
        }
        // If an existing score was found, we proceed without inserting a new one.


        const questionCurrent = test.questions[test.currentQuestion]
        res.status(200).json({
                currentQuestion: test.currentQuestion,
                totalQuestions: test.questions.length,
                testID: test.ID,
                question: questionCurrent.question,
                options: questionCurrent.options,
                isLive: test.isLive
        });

}

module.exports = handleJoinTest;
