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
    <div className='w-[40%] h-[60%] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center content-around justify-around bg-slate-100 rounded-xl'>
      <h1 className='text-2xl'>WebChat Login</h1>
      <div className='w-3/5'>
        <div>Username</div>
        <input id='username-input' className='input-main w-full'></input>
      </div>
      <div className='w-3/5'>
        <label>Password</label>
        <input id='password-input' type='password' className='input-main w-full'></input>
      </div>
      <button onClick={login} className='button-main '>Login</button>
      <Link to="/signup" className='button-main' >Don't have an account? Sign up!</Link>
    </div>
  )


}

export default LoginPage