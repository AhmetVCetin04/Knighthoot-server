// File: api/submitQuestion.js

async function handleSubmitQuestion(req, res, Tests, Scores) {
// takes the student id (int), testID (name, string), and correct boolean (boolean) 
	// // returns the next question
    const { ID,testID,isCorrect } = req.body;
	if(isCorrect==true){
	Scores.updateOne(
		{SID:ID, testID:testID},
            { $inc: { correct:1 } }
        );	
	} else {
	Scores.updateOne(
		{SID:ID, testID:testID},
            { $inc: { incorrect:1 } }
        );	
        }


        res.status(200).json({
		message:"question submitted"
		
        });

}

module.exports = handleSubmitQuestion;
