// File: api/searchScoresByTest.js

async function handleSearchScoresByTest(req, res, Scores) {
    // Get the test ID from the URL path parameter
    const testIdParam = req.params.testId;

    if (!testIdParam) {
         return res.status(400).json({ error: 'Test ID is required in the URL path.' });
    }

    // This code assumes testID in the Scores collection is a STRING (like "Math101" or "123").
    // If testID in Scores is a NUMBER, you'll need to parseInt(testIdParam).
    // Based on your Tests schema, ID is a string, so testID in Scores is likely also a string.

    try {
        // Find all scores matching the test's custom ID (testID)
        const scores = await Scores.find({ testID: testIdParam }).toArray();

        if (scores.length === 0) {
            // This isn't an error, just means no scores found.
             return res.status(200).json([]); // Return an empty array
        }

        res.status(200).json(scores); // Send back the array of score documents

    } catch (e) {
        console.error("Get Scores by Test error:", e);
        res.status(500).json({ error: 'An internal server error occurred while fetching scores.' });
    }
}

module.exports = handleSearchScoresByTest;
