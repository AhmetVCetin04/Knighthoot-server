// File: api/resetPassword.js

// Helper function to find user (same as in forgotPassword.js)
const bcrypt = require("bcryptjs");
async function findUserByEmail(email, Teachers, Students) {
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

async function handleResetPassword(req, res, Teachers, Students) {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: "Email, OTP, and newPassword are required." });
    }

    try {
        const { user, collection } = await findUserByEmail(email, Teachers, Students);

        if (!user) {
            return res.status(400).json({ error: "Invalid OTP or email." }); // Generic error
        }

        // --- Check if OTP is valid and not expired ---
        if (user.resetOtp !== otp || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
            await collection.updateOne({ _id: user._id }, { $unset: { resetOtp: "", resetOtpExpires: "" } });
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        // --- Update Password and clear OTP ---
        //note! edited to include password hashing, before it wasn't actually updating the password for mobile
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await collection.updateOne(
          { _id: user._id },
          {
            $set: { password: hashedPassword }, 
            $unset: { resetOtp: "", resetOtpExpires: "" }
          }
        );

        res.status(200).json({ message: "Password reset successful." });

    } catch (e) {
        console.error("Reset Password error:", e);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
}

module.exports = handleResetPassword;
