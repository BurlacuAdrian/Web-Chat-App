import ContactsContainer from "./ContactsContainer";
import { MENU_STYLE, MOBILE_MENU_STYLE } from './Syles.js'
import { useEffect, useRef, useState } from 'react'
import axiosInstance from '../Auth/axiosConfig'
import { formatUTCDate } from './HelperFunctions'
import { Link} from 'react-router-dom'

const USER_PFP_BASE_URL = 'http://localhost:8080/api/v1/profile_picture'
const GROUP_PIC_BASE_URL = 'http://localhost:8080/api/v1/group_picture'
const hoverTransitionClassName = ' transition-transform duration-200 hover:-translate-y-1 hover:cursor-pointer'


export default function NavBar({openConversation, conversations, username, navigate, displayName, openNewConversationsModal}){

  const handleLogoutButton = async () => {
    localStorage.setItem('username', null)
    const response = await axiosInstance.post(`/logout`)
    navigate('/login')
  }

  return (
    <div id='navbar' className="lg:col-span-1 h-full lg:block  col-span-3 m-8 box-border z-10">
        {/* User details and profile button */}
        <div className="grid grid-rows-2 h-[10vh]">
          <div className="grid grid-cols-5 p-2 rounded-lg">
            <img className='rounded-lg col-span-1 size-16' src={`${USER_PFP_BASE_URL}/${username}`} />
            <div className='col-span-3 grid-rows-2'>
              <div className='pl-4 pt-4'>Hello, {displayName} !</div>
              <div className='pl-4'>({username})</div>
            </div>
            <Link className='col-span-1 m-auto' to='/profile'>Profile</Link>
          </div>
        </div>

        {/* contacts container */}
        <ContactsContainer
        openConversation={openConversation}
        conversations={conversations}
        />

        <div className={'mt-auto bottom-0 absolute'}>
          <button onClick={handleLogoutButton} className='bg-gray-300 p-4 m-4 ml-8 rounded-lg'>Logout</button>
          <button className='bg-blue-400 p-8 m-4 rounded-lg' onClick={openNewConversationsModal}>New conversation</button>
          {/* <img src='../sun.svg' className={'size-16 inline-block align-middle ml-8 '+hoverTransitionClassName} onClick={handleDarkModeToggle}></img> */}
        </div>
      </div>
  )
}