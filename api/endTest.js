// File: api/endTest.js

async function handleEndTest(req, res, Tests) {
    // Incoming: TID (Teacher's ID), ID (Custom Test ID)
    const { TID, ID } = req.body;

    // Basic validation
    if (TID === undefined || !ID) {
        return res.status(400).json({ error: 'Missing required fields: TID and ID are required to end a test.' });
    }

    try {
        // Find the test by its ID and verify the Teacher ID
        const test = await Tests.findOne({ ID: ID, TID: TID });

        if (!test) {
            return res.status(404).json({ error: `Test with ID '${ID}' not found or you do not have permission to end it.` });
        }

        // Check if the test is actually live
        if (!test.isLive) {
            return res.status(400).json({ error: `Test '${ID}' is not currently live.` });
        }

        // Update the test: set isLive to false and reset currentQuestion
        const updateResult = await Tests.updateOne(
            { ID: ID, TID: TID },
            { $set: { isLive: false, currentQuestion: -1 } } // Reset state
        );

        if (updateResult.modifiedCount === 0) {
            // Should not happen if found and was live, but check anyway
            return res.status(500).json({ error: `Failed to update test '${ID}' status.` });
        }

        res.status(200).json({
            message: `Test '${ID}' ended successfully and counters reset.`
        });

    } catch (e) {
        console.error("End Test error:", e);
        res.status(500).json({ error: 'An internal server error occurred during test end.' });
    }
}

module.exports = handleEndTest;
