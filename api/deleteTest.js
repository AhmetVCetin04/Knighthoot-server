// File: api/deleteTest.js

async function handleDeleteTest(req, res, Tests) {
    const testIdToDelete = req.params.testId; // Get ID from URL path (string)
    const { TID } = req.body; // Get TID from body (number)

    // Check if TID was provided in the body
    if (TID === undefined) {
         return res.status(400).json({ error: 'Teacher ID (TID) is required in the body to verify ownership.' });
    }

    // --- FIX: Removed the parseInt() block ---
    // We treat the testIdToDelete as a string, which matches your database.

    try {
        // Use the testIdToDelete string directly in the query
        const result = await Tests.deleteOne({ ID: testIdToDelete, TID: TID });

        if (result.deletedCount === 0) {
            // If nothing matched, send 404
            return res.status(404).json({ error: `Test with ID '${testIdToDelete}' not found or you do not have permission to delete it.` });
        }

        // Send success response
        res.status(200).json({ message: `Test '${testIdToDelete}' deleted successfully.` });

    } catch (e) {
        console.error("Delete Test error:", e);
        res.status(500).json({ error: 'An internal server error occurred during test deletion.' });
    }
}

module.exports = handleDeleteTest;
