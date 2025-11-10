// File: api/register.js
const bcrypt = require("bcryptjs");

async function handleRegister(req, res, Teachers, Students) { // Takes Teachers and Students collections
    const { firstName, lastName, username, password, email, isTeacher } = req.body;

    if (typeof isTeacher !== 'boolean') {
        return res.status(400).json({ error: 'isTeacher boolean field is required.' });
    }
    if (!firstName || !lastName || !username || !password || !email) {
         return res.status(400).json({ error: 'Missing required fields (firstName, lastName, username, password, email).' });
    }

    try {
        let collectionToUse;
        let userType;
        let nextId;

        if (isTeacher) {
            collectionToUse = Teachers;
            userType = 'Teacher';
        } else {
            collectionToUse = Students;
            userType = 'Student';
        }

        const lastUser = await collectionToUse.find().sort({ ID: -1 }).limit(1).toArray();
	nextId = lastUser.length === 0 ? 1 : lastUser[0].ID + 1;

        const existingUser = await collectionToUse.findOne({ $or: [{ username: username }, { email: email }] });
        if (existingUser) {
            return res.status(400).json({ error: `${userType} username or email already exists.` });
        }

	const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            ID: nextId,
            firstName,
            lastName,
            username,
            password: hashedPassword, // Storing hashed password
            email
        };

        const result = await collectionToUse.insertOne(newUser);
        if (result.insertedId) {
            const userResponse = { ...newUser };
            delete userResponse.password;
            res.status(201).json({ user: userResponse, message: `${userType} created successfully.` });
        } else {
            res.status(500).json({ error: `Failed to create ${userType}.` });
        }

    } catch (e) {
        console.error("Registration error:", e);
        res.status(500).json({ error: 'An internal server error occurred during registration.' });
    }
}

module.exports = handleRegister;
