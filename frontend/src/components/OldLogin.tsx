import React, { useState } from 'react';

function Login()
{
	const [message,setMessage] = useState('');
	const [loginName,setLoginName] = useState('');
	const [loginPassword,setPassword] = useState('');


	function handleSetName( e: any ) : void
	{
		setLoginName( e.target.value );
	}
	function handleSetPassword( e: any ) : void
	{
		setPassword( e.target.value );
	}

    function goToRegister():void{
		window.location.href = '/register';
    }

	async function doLogin(event:any) : Promise<void>
	{
		event.preventDefault();
		var obj = {username:loginName,password:loginPassword};
		var js = JSON.stringify(obj);
		try
		{
			const response = await fetch('http://174.138.73.101:5000/api/login',{method:'POST',body:js,headers:{'Content-Type':'application/json'}});

			var res = JSON.parse(await response.text());
			
			if( res.id <= 0 )
				{
					setMessage('User/Password combination incorrect');
				}
				else
					{
						//var user =
						 	//{firstName:res.firstName,lastName:res.lastName,id:res.id,email:res.email};
						localStorage.setItem('user_data', JSON.stringify(res));
						setMessage('');
						window.location.href = '/cards';
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
		<span id="inner-title">Log In</span><br />
		<input type="text" id="loginName" placeholder="Username" onChange={handleSetName} /><br />
		<input type="password" id="loginPassword" placeholder="Password" onChange={handleSetPassword} /><br />
		<input type="submit" id="loginButton" className="buttons" value = "Login"
		onClick={doLogin} />
        <input type="submit" id="registerButton" className="buttons" value = "Register"
		onClick={goToRegister} />
		<span id="loginResult">{message}</span>
		</div>
	);
};
export default Login;