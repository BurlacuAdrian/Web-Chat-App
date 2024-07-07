import { useEffect, useState } from 'react'
import {Link,useNavigate} from 'react-router-dom';
import axiosInstance from './axiosConfig';
import { resetToken } from '../Chat/socket';

export default function SignUpPage({setLoggedIn}) {
  const navigate = useNavigate();

  async function signup(){
    const username = document.querySelector('#username-input').value
    const password = document.querySelector('#password-input').value

    try {
      const response = await axiosInstance.post("/signup", {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        localStorage.setItem("username",username)
        resetToken()
        // setLoggedIn(true)
        navigate('/');
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('API call error:', error);
    }
  }

  return (
    <div id='login-page-container' className='w-[40%] h-[60%] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center content-around justify-around bg-slate-100 rounded-xl'>
      <h1>WebChat Sign Up</h1>
      <div className='w-3/5'>
        <div>Username</div>
        <input id='username-input' className='input-main w-full'></input>
      </div>
      <div className='w-3/5'>
        <label>Password</label>
        <input id='password-input' type='password' className='input-main w-full'></input>
      </div>
      <button onClick={signup} className='button-main '>Create account</button>
      <Link to="/login" className='button-main ' >Already have an account? Log in</Link>
      
    </div>
  )


}