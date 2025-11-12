// File: api/searchScoresByTest.js

// NOTE: This function now requires the 'Students' collection.
async function handleSearchScoresByTest(req, res, Scores, Students) {
    // Get the test ID from the URL path parameter
    const testIdParam = req.params.testId;

    if (!testIdParam) {
         return res.status(400).json({ error: 'Test ID is required in the URL path.' });
    }

    try {
        // Step 1: Find all scores for the given test ID
        const scores = await Scores.find({ testID: testIdParam }).toArray();

        if (scores.length === 0) {
            // This isn't an error, just means no scores found.
             return res.status(200).json([]); // Return an empty array
        }

        // Step 2: Get all the unique Student IDs (SID) from the scores
        // We use a Set to ensure IDs are unique, then convert back to an array
        const studentIds = [...new Set(scores.map(score => score.SID))];

        // Step 3: Find all students who match these IDs in a single query
        const students = await Students.find({ ID: { $in: studentIds } }).toArray();

        // Step 4: Create a "lookup map" for quick access to student data
        // This maps an ID (e.g., 3) to the full student object
        const studentMap = new Map();
        students.forEach(student => {
            studentMap.set(student.ID, student);
        });

        // Step 5: Combine the score data with the student data
        const detailedScores = scores.map(score => {
            const student = studentMap.get(score.SID);
            
            // Define what to return if a student is not found (e.g., deleted)
            const studentInfo = student
                ? {
                    firstName: student.firstName,
                    lastName: student.lastName,
                    username: student.username
                  }
                : {
                    firstName: "Deleted",
                    lastName: "User",
                    username: "deleted_user"
                  };

            // Return a new object with the score fields and the new student info
            return {
                ...score, 
                ...studentInfo 
            };
        });

        res.status(200).json(detailedScores); // Send back the combined array

    } catch (e) {
        console.error("Get Scores by Test error:", e);
        res.status(500).json({ error: 'An internal server error occurred while fetching scores.' });
    }
}

module.exports = handleSearchScoresByTest;
