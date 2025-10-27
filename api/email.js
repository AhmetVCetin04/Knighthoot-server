//import { Auth } from "two-step-auth";
const Auth = require("two-step-auth");
const nodeMailer = require("nodemailer");
require('dotenv').config();

async function handleEmail(req, res, db) {
    const { email: targetEmail } = req.body;
	const apiEmail = process.env.EMAIL_USER;
	const apiPass = process.env.EMAIL_PASSWORD;
	
    if (!targetEmail) {
        return res.status(400).json({ error: "Email is required in the request body." });
    }
	

	

    trynsporter = nodemailer.createTransport({
	      host: “smtp.zoho.com”,
	      secure: true,
	      port: 465,
	      auth: {
		          user: apiEmail,
		          pass: apiPass,
		        },
    });
	

	{
	const otp = Math.floor(100000 + Math.random() * 900000);
	const mailOptions = {
		 from: apiEmail, // sender address
		 to: targetEmail,
		 subject: “Knighthoot OTP Reset: ” + otp.toString(), // Subject line
		 html: <p>One time password: {otp}</p>, // plain text body
	};

        // Teammate will add specific logic here

        if (authResult.success) {
            res.status(200).json({
                message: "OTP email sent successfully (placeholder response).",
                mail: authResult.mail,
                success: authResult.success
            });
        } else {
            res.status(500).json({ error: "Failed to send OTP email.", details: authResult });
        }

    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "An internal server error occurred while sending the email." });
    }
}

module.exports = handleEmail;
