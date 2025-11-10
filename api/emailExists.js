//import { Auth } from "two-step-auth";

async function checkEmailExists(req,res,Teachers,Students){

    const { email: targetEmail } = req.body;

    if (!targetEmail) {
        return res.status(400).json({ error: "Email is required in the request body." });
    }

	let match = await Teachers.find({ email:targetEmail }).toArray(); // Plain text check
	if(match.length==0){ // if no teachers found
		
		match = await Students.find({ email:targetEmail }).toArray(); // Plain text check
		if(match.length==0){ // if no students found either
			return res.status(400).json({exists:false}); // exit the program. no email found	
		}
	}
	return res.status(200).json({exists:true});
}
module.exports = checkEmailExists;
