import { useEffect, useState } from 'react';
import {MENU_STYLE, MOBILE_MENU_STYLE} from '../Syles.js'
import axiosInstance from '../../Auth/axiosConfig'

export default function NewConversationModal({openConversation, openNewGroupModal, closeModal, mobileVersion}){

  const USER_PFP_BASE_URL = 'http://localhost:8080/api/v1/profile_picture'
  const GROUP_PIC_BASE_URL = 'http://localhost:8080/api/v1/group_picture'

  const hoverTransitionClassName = ' transition-transform duration-200 hover:-translate-y-1 hover:cursor-pointer'

  const [searchText, setSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([])

  /*** HANDLERS ***/
  const handleInputChange = (event) => {
    setSearchText(event.target.value);
  };

  const filterUsers = (text) => {
    const filteredUsers = searchedUsers.filter(userElement =>
      userElement.username.includes(text) || userElement.display_name.includes(text)
    );
    setFilteredUsers(filteredUsers);
  };

  /*** API ***/

  const updateSearchedUsers = async () => {
    const response = await axiosInstance.get("/users")
    const data = await response.data
    setSearchedUsers(data)
  }

  /*** On load ***/

  useEffect( () => {
    updateSearchedUsers()
  },[])

  useEffect(() => {
    // Initial filter when searchedUsers changes
    filterUsers(searchText);
  }, [searchText, searchedUsers]);

  return (
    <div className={'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-3/5 bg-blue-100 rounded-xl flex flex-col items-center p-4 ' + MENU_STYLE + (mobileVersion ? MOBILE_MENU_STYLE : '')}>
      <span className=''>Start a new conversation with : </span>
      <input
        className='w-3/5 input-main'
        placeholder='Enter a username or full name to filter'
        value={searchText}
        onChange={handleInputChange}
      />
      <div className="bg-blue-100 w-3/5 h-3/5 flex flex-col gap-4 overflow-y-scroll rounded-lg mt-4">
        {filteredUsers.map(userElement => {
          return (
            <div className={'flex gap-2 p-2' + hoverTransitionClassName} onClick={() => openConversation(userElement.username, 'user')}>
              <img src={`${USER_PFP_BASE_URL}/${userElement.username}`} className='size-12 rounded-lg' />
              <div>{userElement.display_name} ({userElement.username})</div>
              {/* <div></div> */}
            </div>
          )
        })}
      </div>
      <span className='mt-4'>Or you can </span>
      <button onClick={openNewGroupModal} className='button-main mt-4'>Create a new group</button>
      <button onClick={closeModal} className='button-main mt-4'>Cancel</button>
    </div>
  )
}