const { Auth } = require("two-step-auth");



export function email(email)
{
        const res = Auth(email, "Knighthoot");
        console.log(res);
        console.log(res.mail);
        console.log(res.OTP);
        console.log(res.success);


    return {res:res, resmail:res.mail,resOTP:res.OTP,ressuccess:res.success };

};
