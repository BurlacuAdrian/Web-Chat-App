import { useState } from "react"
import axiosInstance from '../../Auth/axiosConfig'
import {MENU_STYLE, MOBILE_MENU_STYLE} from '../Syles.js'

export default function NewGroupModal({closeModal, openConversation, mobileVersion}) {

  const [newGroupNameInputText, setNewGroupNameInputText] = useState('')

  /*** Handlers ***/

  const handleCreateNewGroupButton = async () => {
    const groupName = newGroupNameInputText
    setNewGroupNameInputText('')
    const groupId = await createGroup(groupName)
    openConversation(groupId, "group")
  }

  /*** API ***/

  const createGroup = async (groupName) => {
    //TODO handle group creation error
    const response = await axiosInstance.post('/group', {
      group_name: groupName,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const groupId = await response.data.group_id
    return groupId
  }

  return (
    <div className={'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-3/5 bg-blue-100 rounded-xl flex flex-col items-center p-4 pt-8 pb-8 justify-around' + MENU_STYLE + (mobileVersion ? MOBILE_MENU_STYLE : '')}>
      <span className=''>Create a new group </span>
      <input className='w-3/5 input-main' placeholder='Enter a group name' value={newGroupNameInputText}
        onChange={(e) => setNewGroupNameInputText(e.target.value)}></input>
      {/* <span>Add your friends!</span>
          <input className='w-3/5' placeholder='Enter a username or full name'></input> */}
      {/* <div className="bg-blue-100 w-3/5 h-1/2"></div> */}
      <br />
      <button onClick={handleCreateNewGroupButton} className='button-main'>Create group</button>
      <br />
      <button onClick={closeModal} className='button-main'>Cancel</button>
    </div>
  )
}