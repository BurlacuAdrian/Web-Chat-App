import ContactsContainer from "./ContactsContainer";
import { MENU_STYLE, MOBILE_MENU_STYLE } from './Syles.js'
import { useEffect, useRef, useState } from 'react'
import axiosInstance from '../Auth/axiosConfig'
import { formatUTCDate } from './HelperFunctions'
import { Link } from 'react-router-dom'

const USER_PFP_BASE_URL = 'http://localhost:8080/api/v1/profile_picture'
const GROUP_PIC_BASE_URL = 'http://localhost:8080/api/v1/group_picture'
const hoverTransitionClassName = ' transition-transform duration-200 hover:-translate-y-1 hover:cursor-pointer'


export default function NavBar({ openConversation, conversations, username, navigate, mobileVersion, displayName, openNewConversationsModal }) {

  const handleLogoutButton = async () => {
    localStorage.setItem('username', null)
    const response = await axiosInstance.post(`/logout`)
    navigate('/login')
  }

  const getMobileStyle = (mobileVersion) => {
    switch (mobileVersion) {
      case 0:
        return ''
      case 1:
        return '!col-span-3'
      case 2:
        return '!hidden'
      default:
        break;
    }
  }

  return (
    <div id='navbar' className={`bg-slate-100 h-full col-span-1 p-8 box-border z-10 flex flex-col ${getMobileStyle(mobileVersion)} h-screen`}>
      {/* User details and profile button */}
      <div className="mb-4">
        <div className="grid grid-cols-5 p-2 rounded-lg items-center">
          <img className='rounded-lg col-span-1 w-16 h-16' src={`${USER_PFP_BASE_URL}/${username}`} alt="User profile" />
          <div className='col-span-3'>
            <div className='pl-4'>Hello, {displayName} !</div>
            <div className='pl-4'>({username})</div>
          </div>
          <Link className='col-span-1 text-center border border-black border-solid p-2 rounded-xl shadow-lg hover:bg-black hover:text-white' to='/profile'>Profile</Link>
        </div>
      </div>

      {/* contacts container */}

      <div className="h-full flex flex-col justify-between">
        <div className='flex-3 h-3/4 overflow-y-auto'>
          <ContactsContainer
            openConversation={openConversation}
            conversations={conversations}
          />
        </div>
        {/* <br/> */}
        <div className='flex-1 h-fit lg:mt-12'>
          <div className='flex flex-col lg:flex-row justify-center items-center'>
            <button onClick={handleLogoutButton} className='bg-gray-300 p-4 m-2 rounded-lg w-full lg:w-auto'>Logout</button>
            <button className='bg-blue-400 p-4 rounded-lg m-2 w-full lg:w-auto' onClick={openNewConversationsModal}>New conversation</button>
          </div>

        </div>
      </div>
    </div>
  )
}