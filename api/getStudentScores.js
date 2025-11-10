// File: api/getStudentScores.js

async function handleGetStudentScores(req, res, Scores) {
    // Get the student ID from the URL path parameter
    const studentIdParam = req.params.studentId;

    // Convert the parameter to a number (assuming SID in DB is a number)
    const studentIdNum = parseInt(studentIdParam);
    if (isNaN(studentIdNum)) {
        return res.status(400).json({ error: 'Student ID in URL must be a valid number.' });
    }

    try {
        // Find all scores matching the student's ID (SID)
        const scores = await Scores.find({ SID: studentIdNum }).toArray();

        // Optional: Could check if the student exists before sending scores back
        // if (scores.length === 0) {
        //    Maybe check Students collection? Or just return empty array.
        // }

        res.status(200).json(scores); // Send back the array of score documents

    } catch (e) {
        console.error("Get Student Scores error:", e);
        res.status(500).json({ error: 'An internal server error occurred while fetching scores.' });
    }
}

module.exports = handleGetStudentScores;
