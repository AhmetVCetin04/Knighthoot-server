// File: api/duplicateTest.js

async function handleDuplicateTest(req, res, Tests) {
    // Incoming: TID (Teacher's ID), originalTestID, newTestID, newPIN
    const { TID, originalTestID, newTestID, newPIN } = req.body;

    if (TID === undefined || !originalTestID || !newTestID || !newPIN) {
        return res.status(400).json({ error: 'Missing required fields: TID, originalTestID, newTestID, and newPIN.' });
    }

    if (originalTestID === newTestID) {
        return res.status(400).json({ error: 'New Test ID must be different from the Original Test ID.' });
    }

    try {
        // Find the original test to copy
        const originalTest = await Tests.findOne({ ID: originalTestID, TID: TID });

        if (!originalTest) {
            return res.status(404).json({ error: `Original test with ID '${originalTestID}' not found or you do not have permission to duplicate it.` });
        }

        // Check if the new test ID is already taken
        const existingTest = await Tests.findOne({ ID: newTestID });
        if (existingTest) {
            return res.status(400).json({ error: `A test with the new ID '${newTestID}' already exists.` });
        }

        // Create the new test object by copying and modifying the original
        const newTest = {
            TID: originalTest.TID,
            ID: newTestID,       // Set new ID
            PIN: newPIN,         // Set new PIN
            questions: originalTest.questions, // Copy the questions
            isLive: false,       // Reset live status
            currentQuestion: -1  // Reset question counter
        };

        // Insert the new document
        const result = await Tests.insertOne(newTest);
        if (result.insertedId) {
            res.status(201).json({ test: newTest, message: `Test '${originalTestID}' duplicated successfully to '${newTestID}'.` });
        } else {
            res.status(500).json({ error: `Failed to create duplicate test.` });
        }

    } catch (e) {
        console.error("Duplicate Test error:", e);
        res.status(500).json({ error: 'An internal server error occurred during test duplication.' });
    }
}

module.exports = handleDuplicateTest;
