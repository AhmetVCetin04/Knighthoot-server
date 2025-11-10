import React, { useState } from 'react';
import pegasusIcon from '../assets/pegasus.png'
import knightHelmetIcon from '../assets/knight.png'

export type UserType = 'student' | 'teacher'

interface AccountTypeSelectionProps {
  onSelectType: (type: UserType) => void
  onNavigateToLogin: () => void
}

function AccountType ({onSelectType, onNavigateToLogin,}: AccountTypeSelectionProps) 
{
return (
    <div id="accountTypeCard">
      <p className="accountType__title">
        Choose the account type that best describes you.
      </p>

      <div className="accountType__grid">
        <button
          type="button"
          className="optionbtn optionbtn--student"
          onClick={() => onSelectType('student')}
        >
          <img src={pegasusIcon} alt="" className="optionbtn__icon" />
          <span className="optionbtn__text">Student</span>
        </button>

        <button
          type="button"
          className="optionbtn optionbtn--teacher"
          onClick={() => onSelectType('teacher')}
        >
          <img src={knightHelmetIcon} alt="" className="optionbtn__icon" />
          <span className="optionbtn__text">Teacher</span>
        </button>
      </div>

      <p className="accountType__foot">
        Already have an account?{' '}
        <button type="button" className="link" onClick={onNavigateToLogin}>
          Login
        </button>
      </p>
    </div>
  )
}
export default AccountType;