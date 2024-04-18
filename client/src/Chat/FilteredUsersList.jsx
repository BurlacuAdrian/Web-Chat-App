import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../Auth/axiosConfig'

export default function FilteredUsersList({type}) {

  const [searchText, setSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    // Initial filter when searchedUsers changes
    filterUsers(searchText);
  }, [searchText, searchedUsers]);

  const handleInputChange = (event) => {
    setSearchText(event.target.value);
  };

  const filterUsers = (text) => {
    const filteredUsers = searchedUsers.filter(userElement =>
      userElement.username.includes(text) || userElement.display_name.includes(text)
    );
    setFilteredUsers(filteredUsers);
  };

  return (
    <div>
      <input
        className='w-3/5'
        placeholder='Enter a username or full name'
        value={searchText}
        onChange={handleInputChange}
      />
      <div className="bg-blue-100 w-3/5 h-1/2 flex flex-col gap-4">
        {filteredUsers.map(userElement => {
          return (
            <div className={'flex border border-solid border-black gap-2 p-2' + hoverTransitionClassName} onClick={type == 'user' ? openConversation(userElement.id,'user') : }>
              <img src={`${USER_PFP_BASE_URL}/${userElement.username}`} className='size-12' />
              <div>{userElement.display_name}</div>
              <div>{userElement.username}</div>
            </div>
          )
        })}
      </div>
    </div>
  )


}