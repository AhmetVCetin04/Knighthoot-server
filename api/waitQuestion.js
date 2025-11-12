async function handleWaitQuestion(req, res, Tests) {
// takes the student id (int), testID (name, string), and correct boolean (boolean) 
	// // returns the next question
	//


	const { testID } = req.body;
//	console.log(testID);
	const test = await Tests.findOne({ID:testID});
	const _id = test._id;
	const origQuestion = test.currentQuestion;
	async function checkQuestion(){
		let test = await Tests.findOne({_id:_id});
		//console.log(test.currentQuestion);
		if(origQuestion == test.currentQuestion){
			await new Promise(resolve => setTimeout(resolve, 500));
			await checkQuestion();
		}
	}



	try{
	await checkQuestion();
	// Fetch the updated test after question changed
	const updatedTest = await Tests.findOne({ID:testID});
	const questionElement = updatedTest.questions[origQuestion];
	const answer = questionElement.correctIndex;
	//console.log("THE WAIT IS OVER");
	console.log("question #",origQuestion,' answer: ', answer);
	return res.status(200).json({
		answer:answer
	});
	}catch(error){
	//	console.log("WAIT ERROR");
		return res.status(400).json({
			error:error.toString()
			});
	}

}

module.exports = handleWaitQuestion;
