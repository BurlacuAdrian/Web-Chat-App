import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios'
import LoginPage from './Auth/LoginPage';
import SignUpPage from './Auth/SignupPage';
import ChatPage from './Chat/ChatPage'
import ProfilePage from './Profile/ProfilePage';

function App() {
  axios.defaults.baseURL = 'http://localhost:8080/api/v1';
  axios.defaults.withCredentials = true;

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/signup' element={<SignUpPage/>}></Route>
        <Route path='/login' element={<LoginPage/>}></Route>
        <Route path='/' element={<ChatPage/>}></Route>
        <Route path='/profile' element={<ProfilePage/>}></Route>
      </Routes>
    </BrowserRouter>
  )
}


export default App
