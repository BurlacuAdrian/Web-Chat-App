import {formatUTCDate} from '../HelperFunctions.js'
import {MENU_STYLE, MOBILE_MENU_STYLE} from '../Syles.js'
import { useEffect, useState } from 'react'
import axiosInstance from '../../Auth/axiosConfig'

export default function GroupOptionsModal({selectedConversation, closeModal, setMessages, setInConversationWith, setConversations ,mobileVersion, conversations, socketRef}) {

  const USER_PFP_BASE_URL = 'http://localhost:8080/api/v1/profile_picture'
  const GROUP_PIC_BASE_URL = 'http://localhost:8080/api/v1/group_picture'

  const hoverTransitionClassName = ' transition-transform duration-200 hover:-translate-y-1 hover:cursor-pointer'


  const [addFriendByUsernameInputText, setAddFriendByUsernameInputText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [groupMembers, setGroupMembers] = useState([])


  /*** HANDLERS ***/

  const handleAddFriendButton = () => {
    closeModal()
    addFriendToGroup(addFriendByUsernameInputText)
    setAddFriendByUsernameInputText('')
  }

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  }

  const handleLeavingGroup = () => {
    leaveGroup()
    closeModal()
  }
  
  /*** API ***/

  const getGroupMembers = async (groupId) => {
    const response = await axiosInstance.get(`/group_members/${groupId}`)
    const data = await response.data
    setGroupMembers(data)
  }

  const addFriendToGroup = async (friendName) => {
    const response = await axiosInstance.post(`/group/${selectedConversation.current.id}/${friendName}`)

    var display_name = selectedConversation.current.id
    conversations.forEach(conversationElement => {
      if (conversationElement.id == selectedConversation.current.id) {
        display_name = conversationElement.display_name
      }
    })

    socketRef.current.emit('add-to-group', { friend_username: friendName, group_id: selectedConversation.current.id, display_name })
  }

  const leaveGroup = async () => {
    const response = await axiosInstance.delete(`/group/${selectedConversation.current.id}`)

    setMessages([])
    setInConversationWith(null)
    const thisConversationId = selectedConversation.current.id
    setConversations(oldValue => {
      const newValue = [...oldValue]
      return newValue.filter(conversationElement => {
        return conversationElement.id !== thisConversationId
      })
    })
    selectedConversation.current = { id: null }

  }

  const handleSubmit = async () => {
    if (!selectedFile)
      return

    if (selectedConversation.current.type != 'group') {
      console.log("Not in a group conversation")
      return
    }

    try {
      const formData = new FormData()
      formData.append('group_picture', selectedFile)

      const response = await axiosInstance.put(`/group_picture/${selectedConversation.current.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.status === 201) {
        console.log('Group picture updated successfully.')
        setSelectedFile(null)

        const groupImage = document.getElementById('img-' + selectedConversation.current.id)
        groupImage.setAttribute('src', `${GROUP_PIC_BASE_URL}/${selectedConversation.current.id}`)

      } else {
        console.error('Failed to update group picture.')

      }
    } catch (error) {
      console.error('Error updating group picture:', error)
    }
  }


  useEffect( () => {
    getGroupMembers(selectedConversation.current.id)
  },[])
  

  return (
    <div className={'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-3/5 bg-blue-100 rounded-xl grid grid-cols-2 grid-rows-1 gap-x-12 ' + MENU_STYLE + (mobileVersion ? MOBILE_MENU_STYLE : '')}>
      <div className='p-4 pl-8'>
        <p>Group members : </p>
        <div className="bg-blue-100 w-full h-3/4 overflow-y-scroll flex flex-col gap-4 mt-4 rounded-lg">
          {groupMembers.map(userElement => {
            return (
              <div className={'flex gap-2 p-2' + hoverTransitionClassName}>
                <img src={`${USER_PFP_BASE_URL}/${userElement.username}`} className='size-12' />
                <div>{userElement.display_name} ({userElement.username})</div>
                <div>Joined at : {formatUTCDate(userElement.joined_at)}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className='flex flex-col items-center p-4 gap-8 justify-between mt-8 mb-8'>
        <input placeholder="Enter a friend's username" value={addFriendByUsernameInputText} onChange={(e) => setAddFriendByUsernameInputText(e.target.value)} className='input-main'></input>
        <button onClick={handleAddFriendButton} className='button-main'>Add friend</button>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button className='button-main' onClick={handleSubmit} >Update profile picture</button>
        <button onClick={handleLeavingGroup} className='button-main'>Leave group</button>
        <button onClick={closeModal} className='button-main'>Cancel</button>
      </div>

    </div>
  )
}