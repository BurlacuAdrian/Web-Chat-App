import { useEffect, useState } from 'react'
import {Link,useNavigate} from 'react-router-dom';
import axiosInstance from './axiosConfig';

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
    <div id='login-page-container'>
      <h1>WebChat Sign Up</h1>
      <input id='username-input'></input>
      <input id='password-input' type='password'></input>
      <button onClick={signup}>Create account</button>
      <Link to="/login" className='log-button' >Already have an account? Log in</Link>
      
    </div>
  )


}