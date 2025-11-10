// File: api/readTest.js

async function handleReadTest(req, res, Tests) {
    // Check for a specific test ID in the path parameter first
    const testIdFromParam = req.params.testId;
    // Check for a general search query parameter
    const searchQuery = req.query.search;
    // Check for Teacher ID query parameter (for teacher-specific view)
    const teacherId = req.query.TID;

    try {
        let results;

        if (testIdFromParam) {
            // --- Fetch a single test by its custom ID ---
            console.log("Attempting findOne by ID:", testIdFromParam);
            // Convert param to number if IDs are numbers, keep as string if they are strings like "Math101"
            // Assuming IDs like "123", "Math101" are strings based on previous examples
            results = await Tests.findOne({ ID: testIdFromParam });

            if (!results) {
                return res.status(404).json({ error: `Test with ID '${testIdFromParam}' not found.` });
            }
            // Remove answers before sending if fetched by ID (for student view)
            if (results.questions && Array.isArray(results.questions)) {
                results.questions.forEach(q => delete q.answer);
            }
             res.status(200).json(results);

        } else if (searchQuery) {
            // --- Perform a general search based on the query parameter ---
            console.log("Attempting search with query:", searchQuery);
            const searchRegex = new RegExp(searchQuery.trim() + '.*', 'i'); // Case-insensitive search
             results = await Tests.find({
                $or: [
                    { ID: { $regex: searchRegex } }, // Search by Test ID (as string)
                    { 'questions.question': { $regex: searchRegex } } // Search within question text
                ]
            }).toArray();

             // Remove answers from all found tests
            if (results && Array.isArray(results)) {
                 results.forEach(test => {
                     if (test.questions && Array.isArray(test.questions)) {
                         test.questions.forEach(q => delete q.answer);
                     }
                 });
             }
             console.log("Search Results:", results);
             res.status(200).json(results); // Send back array of matching tests (without answers)

        } else if (teacherId) {
             // --- Fetch all tests for a specific teacher ID (Teacher view, keep answers) ---
             const tidNum = parseInt(teacherId);
             console.log("Attempting find by TID:", tidNum);
             if (isNaN(tidNum)) {
                 return res.status(400).json({ error: 'Valid TID query parameter required.' });
             }
             results = await Tests.find({ TID: tidNum }).toArray();
             console.log("Find by TID Result:", results);
             res.status(200).json(results); // Send back tests including answers for the teacher

        } else {
            // No specific ID, search query, or TID provided
            console.log("No testId, search query, or teacherId provided.");
            return res.status(400).json({ error: 'Provide a test ID in the path (e.g., /api/test/123), a search query parameter (e.g., /api/test?search=math), or a TID query parameter (e.g., /api/test?TID=0).' });
        }

    } catch (e) {
        console.error("Read Test error:", e);
        res.status(500).json({ error: 'An internal server error occurred while fetching test(s).' });
    }
}

module.exports = handleReadTest;
