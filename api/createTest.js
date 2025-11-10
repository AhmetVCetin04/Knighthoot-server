// File: api/createTest.js

/**
 * Generates a unique 4-digit PIN.
 * Keeps generating new PINs until it finds one that is not already in use in the Tests collection.
 * @param {Collection} Tests - The MongoDB collection for tests.
 * @returns {Promise<string>} A unique 4-digit PIN as a string.
 */
async function generateUniquePin(Tests) {
    let pin;
    let existingTest = true;
    
    while (existingTest) {
        // Generate a 4-digit number (1000 to 9999) and convert to string
        pin = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Check if a test with this PIN already exists (and is possibly live)
        // You might want to refine this check, e.g., only check against *live* tests
        existingTest = await Tests.findOne({ PIN: pin });
        
        // Loop continues if existingTest is found (is not null)
    }
    
    // Once loop finishes, 'pin' is unique
    return pin;
}


async function handleCreateTest(req, res, Tests) {
    // Incoming: TID (Teacher's ID), ID (Custom Test ID), questions array
    // PIN is now auto-generated
    const { TID, ID, questions } = req.body;

    // Basic validation
    if (TID === undefined || !ID || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Missing required fields: TID, ID, and questions (must be an array).' });
    }

    try {
        // Check if Test ID already exists
        const existingTest = await Tests.findOne({ ID: ID });
        if (existingTest) {
            return res.status(400).json({ error: `Test with ID '${ID}' already exists.` });
        }

        // Generate a unique PIN
        const uniquePin = await generateUniquePin(Tests);

        const newTest = {
            TID: TID,
            ID: ID,
            PIN: uniquePin, // Use the auto-generated PIN
            questions: questions,
            isLive: false,      // Default values
            currentQuestion: -1 // Default values
        };

        const result = await Tests.insertOne(newTest);
        if (result.insertedId) {
            res.status(201).json({ test: newTest, message: `Test '${ID}' created successfully with PIN ${uniquePin}.` });
        } else {
            res.status(500).json({ error: `Failed to create test.` });
        }

    } catch (e) {
        console.error("Create Test error:", e);
        res.status(500).json({ error: 'An internal server error occurred during test creation.' });
    }
}

module.exports = handleCreateTest;
