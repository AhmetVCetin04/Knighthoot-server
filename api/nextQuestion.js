// File: api/nextQuestion.js

async function handleNextQuestion(req, res, db) {
    const { TID, ID } = req.body;
	const teacherID = TID;
	const testID = ID;

    if (teacherID === undefined || !testID) {
        return res.status(400).json({ error: "Missing required fields: teacherID and testID." });
    }

    const Tests = db.collection('Tests');

    try {
        // Find the test to ensure it's live and owned by this teacher
        const test = await Tests.findOne({ ID: testID, TID: teacherID, isLive: true });

        if (!test) {
            return res.status(404).json({ error: `Live test with ID '${testID}' not found or you do not have permission.` });
        }

        const currentQuestionIndex = test.currentQuestion;
        const nextQuestionIndex = currentQuestionIndex + 1;

        // --- Logic to provide details of the question *just completed* ---
        let completedQuestionDetails = null;
        if (currentQuestionIndex >= 0 && currentQuestionIndex < test.questions.length) {
            const questionJustAsked = test.questions[currentQuestionIndex];
            completedQuestionDetails = {
                questionIndex: currentQuestionIndex,
                question: questionJustAsked.question,
                options: questionJustAsked.options,
                correctAnswerIndex: questionJustAsked.answer // This is the key addition!
            };
        }
        // If currentQuestionIndex is -1 (test just started, no questions completed yet),
        // then completedQuestionDetails will remain null.

        // Check if the test is over
        if (nextQuestionIndex >= test.questions.length) {
            // End of test: set isLive to false and reset counter
            await Tests.updateOne(
                { _id: test._id },
                { $set: { isLive: false, currentQuestion: -1 } }
            );
            return res.status(200).json({
                message: "Test has ended. No more questions.",
                gameFinished: true,
                completedQuestion: completedQuestionDetails // Still provide last question's details
            });
        } else {
            // Advance to the next question
            await Tests.updateOne(
                { _id: test._id },
                { $inc: { currentQuestion: 1 } } // Increment the question index
            );

            res.status(200).json({
                message: `Advanced to question ${nextQuestionIndex + 1}.`,
                currentQuestion: nextQuestionIndex, // This is the *new* question index
                gameFinished: false,
                completedQuestion: completedQuestionDetails // Details of the question just completed
            });
        }

    } catch (e) {
        console.error("Next Question error:", e);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}

module.exports = handleNextQuestion;
