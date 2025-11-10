// File: api/updateTest.js

async function handleUpdateTest(req, res, Tests) {
    // Incoming: testId in URL params, TID and updated fields (ID, PIN, questions) in body
    const testIdToUpdate = req.params.testId;
    const { TID, ID, PIN, questions } = req.body;

    if (TID === undefined) {
         return res.status(400).json({ error: 'Teacher ID (TID) is required in the body to verify ownership.' });
    }
    if (!ID && !PIN && !questions) {
        return res.status(400).json({ error: 'At least one field (ID, PIN, or questions) must be provided for update.' });
    }

    try {
        // Construct the update object dynamically based on provided fields
        const updateFields = {};
        if (ID) updateFields.ID = ID;
        if (PIN) updateFields.PIN = PIN;
        if (questions) updateFields.questions = questions;

        // Find the test by its current custom ID AND verify the Teacher ID
        const result = await Tests.updateOne(
            { ID: testIdToUpdate, TID: TID }, // Filter: Match current ID and owner TID
            { $set: updateFields } // Update operation
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: `Test with ID '${testIdToUpdate}' not found or you do not have permission to update it.` });
        }
        if (result.modifiedCount === 0) {
            return res.status(304).json({ message: 'No changes detected or applied.' }); // 304 Not Modified
        }

        // Fetch the updated document to return it (optional)
        const updatedTest = await Tests.findOne({ ID: ID || testIdToUpdate, TID: TID }); // Find by new ID if changed, else old ID
        res.status(200).json({ test: updatedTest, message: `Test '${testIdToUpdate}' updated successfully.` });

    } catch (e) {
        // Handle potential duplicate ID error if the user tries to change ID to one that already exists
        if (e.code === 11000 && e.keyPattern && e.keyPattern.ID) {
             return res.status(400).json({ error: `Cannot update Test ID to '${ID}', as another test with that ID already exists.` });
        }
        console.error("Update Test error:", e);
        res.status(500).json({ error: 'An internal server error occurred during test update.' });
    }
}

module.exports = handleUpdateTest;
