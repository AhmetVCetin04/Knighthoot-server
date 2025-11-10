// File: api/forgotPassword.js
const sgMail = require("@sendgrid/mail");
require('dotenv').config();

// Re-using logic from checkEmailExists.js and email.js for internal use
async function findUserByEmailInternal(email, Teachers, Students) {
    let user = await Teachers.findOne({ email: email });
    if (user) {
        return { user, collection: Teachers };
    }
    user = await Students.findOne({ email: email });
    if (user) {
        return { user, collection: Students };
    }
    return { user: null, collection: null };
}

async function handleForgotPassword(req, res, Teachers, Students) {
    const { email: targetEmail } = req.body;

    if (!targetEmail) {
        return res.status(400).json({ error: "Email is required in the request body." });
    }

    try {
        const { user, collection } = await findUserByEmailInternal(targetEmail, Teachers, Students);
        
        // Security-agnostic: still send a generic message to prevent email enumeration
        if (!user) {
            return res.status(200).json({ message: "If an account with that email exists, a reset code has been sent." });
        }

        // --- Generate OTP and Expiration ---
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minute expiration

        // --- Save OTP to User's Document ---
        await collection.updateOne(
            { _id: user._id },
            { $set: { resetOtp: otp, resetOtpExpires: otpExpires } }
        );

        // --- Send Email using sgMail directly ---
        const apiEmail = process.env.EMAIL_USER;
        const apiKey = process.env.EMAIL_API_KEY; 
        sgMail.setApiKey(apiKey);

        const page = `
                <div style="text-align:center;">
                        <p>Your one time password:</p>
                        <h1 style="font-weight:bold; color:#FFC904; background-color:black; font-size: 80px;">${otp}</h1>
                </div>
        `;

        const msg = ({
            to: targetEmail,
            from: apiEmail,
            subject: "Knighthoot OTP code: " + otp, // Subject changed to match your email.js
            text: "KNIGHTHOOT", // Text content from your email.js
            html: page // HTML content from your email.js
        });

        await sgMail.send(msg);
        res.status(200).json({ message: "If an account with that email exists, a reset code has been sent." });

    } catch (error) {
        console.error("Forgot Password error:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
}

module.exports = handleForgotPassword;
