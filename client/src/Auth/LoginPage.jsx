import { useEffect, useState } from 'react'
import { Link,useNavigate } from 'react-router-dom'
import axiosInstance from './axiosConfig';


function LoginPage({setLoggedIn}) {
  const navigate = useNavigate()

  async function login() {
    const username = document.querySelector('#username-input').value;
    const password = document.querySelector('#password-input').value;
  
    try {
      const response = await axiosInstance.post("/login", {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      if (response.status === 200) {
        localStorage.setItem("username", username);
        // setLoggedIn(true);
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
      <h1>WebChat Login</h1>
      <input id='username-input'></input>
      <input id='password-input' type='password'></input>
      <button onClick={login}>Login</button>
      <Link to="/signup" className='log-button'>Don't have an account? Sign up!</Link>
    </div>
  )


}

export default LoginPage