// File: api/startTest.js

async function handleStartTest(req, res, Tests) {
    const { TID, ID } = req.body;

    if (TID === undefined || !ID) {
        return res.status(400).json({ error: 'Missing required fields: TID and ID are required to start a test.' });
    }

    try {
        const test = await Tests.findOne({ ID: ID, TID: TID });

        if (!test) {
            return res.status(404).json({ error: `Test with ID '${ID}' not found or you do not have permission to start it.` });
        }

        if (test.isLive) {
            return res.status(400).json({ error: `Test '${ID}' is already live.` });
        }

        const updateResult = await Tests.updateOne(
            { ID: ID, TID: TID },
            { $set: { isLive: true, currentQuestion: 0 } }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ error: `Failed to start test '${ID}'.` });
        }

        res.status(200).json({
            message: `Test '${ID}' started successfully.`,
		question: test.questions[0].question,
		options: test.questions[0].options
        });

    } catch (e) {
        console.error("Start Test error:", e);
        res.status(500).json({ error: 'An internal server error occurred during test start.' });
    }
}

module.exports = handleStartTest;
