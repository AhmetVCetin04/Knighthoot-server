export function LoggedInName()
{

    function doLogout(event:any) : void
    {
        event.preventDefault();
        localStorage.removeItem("user_data")
        window.location.href = '/';
    };

    const info = JSON.parse(localStorage.getItem('user_data'))['id'];
    return(
        <div id="loggedInDiv">
        <span id="userName">Logged In</span><br />
        <p>user_data:   {localStorage.getItem('user_data')}</p>
        <button type="button" id="logoutButton" className="buttons"
        onClick={doLogout}> Log Out </button>
        </div>
    );
};