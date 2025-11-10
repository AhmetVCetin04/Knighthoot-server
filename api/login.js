// File: api/login.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function handleLogin(req, res, Teachers, Students) {
    // Takes Teachers and Students collections
    var error = '';
    const { username, password } = req.body;
    let user = null;
    let role = null;

    try {
        // Try finding a teacher
        let teacherResults = await Teachers.find({ username: username }).toArray(); // Plain text check

        if (teacherResults.length > 0) {
            user = teacherResults[0]; // Get the whole user object
            role = 'teacher';
        } else {
            // If not a teacher, try finding a student
            let studentResults = await Students.find({ username: username }).toArray(); // Plain text check

            if (studentResults.length > 0) {
                user = studentResults[0]; // Get the whole user object
                role = 'student';
            }
        }

	if(!user) {
		return res.status(401).json({ error: "Invalid username or password" });
	}

	//compare hashed password
	const validPassword = await bcrypt.compare(password, user.password);
	if(!validPassword) {
		return res.status(401).json({ error: "Invalid username or password" });
	}

	//generate jwt
	const token = jwt.sign(
		{ id: user.ID, role: role },
		process.env.JWT_SECRET,
		{ expiresIn: "6h" }
	);

            // Correctly access properties from the user object found
	const ret = {
        id: user.ID,           // Use the correct field name 'ID'
        _id: user._id,         // MongoDB's unique ID
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: role,            // Add role to know if it's a teacher or student
		token: token,	//return token
		error: ''
	};

	res.status(200).json(ret);

    } catch (e) {
    	console.error("Login error:", e);
    	res.status(500).json({ error: 'An internal server error occurred.' });
    }
}

// Export the function so server.js can use it
module.exports = handleLogin;
