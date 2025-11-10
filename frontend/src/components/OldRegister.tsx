import React, { useState } from 'react';

function Register()
{
	const [message,setMessage] = useState('');
	const [loginName,setLoginName] = useState('');
	const [loginPassword,setPassword] = useState('');


    const [register, setRegister] = useState(false);
    const [registerFirstName,setFirstName] = useState('');
	const [registerLastName,setLastName] = useState('');
	const [registerEmail,setEmail] = useState('');
	const [isTeacher,setTeacher] = useState(false);
	const [verifyCode,isSent] = useState(false);
	const [code,setCode] = useState('');


	function handleSetName( e: any ) : void
	{
		setLoginName( e.target.value );
	}
	function handleSetPassword( e: any ) : void
	{
		setPassword( e.target.value );
	}

    function handleSetFirstName( e: any ) : void
	{
		setFirstName( e.target.value );
	}

    function handleSetLastName( e: any ) : void
	{
		setLastName( e.target.value );
	}

    function handleSetEmail( e: any ) : void
	{
		setEmail( e.target.value );
	}

    function handleSetTeacher( e: any ) : void
	{
		setTeacher(!isTeacher);
	}

	function handleCode(e:any):void
	{
		setCode(e.target.value);
	}




	function emailVerify(e:any):void
	{
		

		isSent(true);

	}


	function codeSubmit(e:any):void
	{

	}


    function goToLogin():void{
		window.location.href = '/';
    }


	async function doRegister(event:any) : Promise<void>
	{

		event.preventDefault();
		var obj = {
			firstName:registerFirstName, 
			lastName:registerLastName, 
            username:loginName,
            password:loginPassword,
			email:registerEmail, 
			isTeacher:isTeacher};
        var js = JSON.stringify(obj);
		try
		{
			const response = await fetch('https://knighthoot.app/api/register',{method:'POST',body:js,headers:{'Content-Type':'application/json'}});

			var res = JSON.parse(await response.text());
			
			if( res.id <= 0 )
				{
					setMessage('User/Password combination incorrect');
				}
				else
					{
						 var user =
						 	{firstName:res.firstName,lastName:res.lastName,id:res.id,email:res.email};
						localStorage.setItem('user_data', JSON.stringify(res));
						setMessage('');
						window.location.href = '/';
					}
		}
		catch(error:any)
		{
			alert(error.toString());
			return;
		}
	};



	return(
		<div id="loginDiv">
		
		{!verifyCode && ( <>	
		<span id="inner-title">PLEASE REGISTER</span><br />
		<input type="text" id="registerName" placeholder="Username" onChange={handleSetName} /><br />
		<input type="password" id="registerPassword" placeholder="Password" onChange={handleSetPassword} /><br />
		<input type="text" id="registerFirstName" placeholder="First Name" onChange={handleSetFirstName} /><br />
		<input type="text" id="registerLastName" placeholder="Last Name" onChange={handleSetLastName} /><br />
		<input type="text" id="registerEmail" placeholder="Email" onChange={handleSetEmail} /><br />
        <p>I am a {isTeacher ? 'teacher' : 'student'}</p>
        <input type="checkbox" id="teacher" onChange={handleSetTeacher} /> <br />
		<input type="submit" id="loginButton" className="buttons" value = "Login"
		onClick={goToLogin} />
        <input type="submit" id="registerButton" className="buttons" value = "Register"
		onClick={emailVerify} />
		</>)}

		{verifyCode && ( <>
		<span id="inner-title">Registration code has been emailed. Check your email.</span><br />
		<input type="text" id="registrationCode" placeholder="123456" onChange={handleCode} /><br />
        <input type="submit" id="submitButton" className="buttons" value = "Submit"
		onClick={doRegister} />
		</>)}
		</div>
	);
};
export default Register;
