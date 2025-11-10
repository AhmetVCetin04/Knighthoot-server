//import { Auth } from "two-step-auth";
const sgMail = require("@sendgrid/mail");
require('dotenv').config();


async function handleEmail(req, res) {
    const { email: targetEmail } = req.body;

    if (!targetEmail) {
        return res.status(400).json({ error: "Email is required in the request body." });
    }

	const apiEmail = process.env.EMAIL_USER;
	const apiKey = process.env.EMAIL_API_KEY;
	


	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	const page= `
		<div style="text-align:center;">
			<p>Your one time password:</p>
			<h1 style="font-weight:bold; color:#FFC904; background-color:black; font-size: 80px;">${otp}</h1>
		</div>
	`;


	sgMail.setApiKey(apiKey);
	const msg= ({
		to:targetEmail,
		from:apiEmail,
		subject:"Knighthoot OTP vode: " + otp,
		text:"KNIGHTHOOT",
		html:page
	});

	sgMail
	.send(msg)
	.then((response) => {
		if (process.env.NODE_ENV !== "test") {
			console.log("Email sent:", response[0].statusCode);
		}
	})
	.catch((error) => {
		if (process.env.NODE_ENV !== "test") {
			console.error("Email error:", error.message);
		}
	});

        res.status(200).json({otp:otp});
}

module.exports = handleEmail;
