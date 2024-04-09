import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { socket } from './socket'
import axiosInstance from '../Auth/axiosConfig'

export default function ChatPage({ setLoggedIn }) {
  const navigate = useNavigate()

  const [username, setUsername] = useState(localStorage.getItem('username'))
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [messageInputText, setMessageInputText] = useState('')
  const [newMessageModal, setNewMessageModal] = useState(false)
  const [newGroupModal, setNewGroupModal] = useState(false)
  const [searchedUsers, setSearchedUsers] = useState([])
  const messageInputRef = useRef(null)
  const sendButtonRef = useRef(null)
  const socketRef = useRef(null)
  const selectedConversation = useRef({id:null})
  const [inConversationWith, setInConversationWith] = useState(null)
  const [newGroupNameInputText, setNewGroupNameInputText] = useState('')
  const [groupOptionsModal, setGroupOptionsModal] = useState(false)
  const [addFriendByUsernameInputText, setAddFriendByUsernameInputText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [reloadImage, setReloadImage] = useState(false)

  const USER_PFP_BASE_URL = 'http://localhost:8080/api/v1/profile_picture'
  const GROUP_PIC_BASE_URL = 'http://localhost:8080/api/v1/group_picture'

  /*** Socket handling ***/

  const [isConnected, setIsConnected] = useState(socket.connected)
  const [fooEvents, setFooEvents] = useState([])

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
    }

    function onDisconnect() {
      setIsConnected(false)
    }

    function onFooEvent(value) {
      setFooEvents(previous => [...previous, value])
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('foo', onFooEvent)

    function receiveMessage(messageObj) {

      //TODO handle not being in conversation and receiving message

      console.log(messageObj)
      setMessages(oldMessages => {
        const newMessages = [...oldMessages]
        newMessages.push(messageObj)
        return newMessages
      })
      
    }

    socket.on('receive-message', receiveMessage)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('foo', onFooEvent)

      socket.off('receive-message', receiveMessage)
    };
  }, [])

  useEffect(() => {
    // no-op if the socket is already connected
    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null
    };
  }, []);

  /*** Socket handling end ***/

  /*** Utils ***/

  const hoverTransitionClassName = ' transition-transform duration-200 hover:-translate-y-1 hover:cursor-pointer'

  const getConversationRoomId = (username1, username2) => {
    const sortedUsernames = [username1, username2].sort();
    const concatenatedUsernames = sortedUsernames.join('-');
    return concatenatedUsernames;
}

  const handleSendingMessage = () => {
    if (messageInputText.length == 0)
      return

    socket.emit("send-mesage", {
      sender: username,
      receiver: selectedConversation.current.id,
      text: messageInputText,
      type: selectedConversation.current.type
    })

    setMessageInputText('');

    messageInputRef.current.focus();
  };

  useEffect( () => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    }
  })

  /*** Utils end ***/



  /*** Page load handling ***/

  useEffect( () => {
    getConversationsFromAPI()
    // const data = await getConversationsFromAPI()
    // console.log(data)
    // setConversations(data)
  },[])

  /*** Page load handling end***/



  /*** API interaction ***/

  const getMessagesFromAPI = async () => {
    const response = await axiosInstance.get(`/messages/${selectedConversation.current.id}`)
    const data = await response.data
    setMessages(data)
  }

  const getConversationsFromAPI = async () => {
    const response = await axiosInstance.get('/conversations')
    const data = await response.data
    setConversations(data)
    // return data
  }

  const updateInteractions = async () => {
    const response = await axiosInstance.put(`/interaction/${selectedConversation.current.id}`)
  }

  const updateGroupInteraction = async () => {
    const response = await axiosInstance.put(`/group/${selectedConversation.current.id}`)
  }

  const createGroup = async (groupName) => {
    const response = await axiosInstance.post('/group',{
      group_name : groupName,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const groupId = await response.data.group_id
    return groupId
  }

  const addFriendToGroup = async (friendName) =>{
    const response = await axiosInstance.post(`/group/${selectedConversation.current.id}/${friendName}`)
  }

  const openConversation = (conversationId, conversationType) => {
    setNewGroupModal(false)
    setNewMessageModal(false)
    
    let room_id

    if(conversationType==="user"){
      const secondUsername = conversationId
      room_id = getConversationRoomId(username,secondUsername)
    }else {//GROUP
      room_id = conversationId
    }

    selectedConversation.current = { id: conversationId, type: conversationType, room_id: conversationId }
    setInConversationWith(conversationId)

    if(conversationType==="user"){
      updateInteractions()
    }else {//GROUP
      updateGroupInteraction()
    }

    getMessagesFromAPI()

    socket.emit('join-room', {
      room_id: room_id,
      conversationType: conversationType
    })
  }

  /*** API interaction end***/



  /*** Modal and button handling ***/

  const openNewMessageModal = async () => {
    setNewMessageModal(true)
    const response = await axiosInstance.get("/users")
    const data = await response.data
    setSearchedUsers(data)
  }


  const handleNewMessageModal = () => {
    setNewMessageModal(oldValue => !oldValue)
  }

  const handleNewGroupModal = () => {
    setNewGroupModal(oldValue => !oldValue)
    setNewMessageModal(false)
  }

  const handleLogoutButton = () => {
    localStorage.setItem('username', null)
    navigate('/login')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendButtonRef.current.click()
    }
  };

  const handleCreateNewGroupButton = async () => {
    const groupName = newGroupNameInputText
    setNewGroupNameInputText('')
    const groupId = await createGroup(groupName)
    openConversation(groupId, "group")
  }

  const handleGroupOptionsModal = () => {
    setGroupOptionsModal(oldValue=>!oldValue)
  }

  const handleAddFriendButton = () => {
    setGroupOptionsModal(false)
    addFriendToGroup(addFriendByUsernameInputText)
    setAddFriendByUsernameInputText('')
  }

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  }

  const handleSubmit = async () => {
    if (!selectedFile) 
      return

    if(selectedConversation.current.type!='group'){
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

      if (response.status===201) {
        console.log('Group picture updated successfully.')
        setSelectedFile(null)
        
        const groupImage = document.getElementById('img-'+selectedConversation.current.id)
        groupImage.setAttribute('src',`${GROUP_PIC_BASE_URL}/${selectedConversation.current.id}`)

      } else {
        console.error('Failed to update group picture.')
        
      }
    } catch (error) {
      console.error('Error updating group picture:', error)
    }
  }

  /*** Modal and button handling end ***/


  return (
    <div id='container' className='w-full h-full grid grid-cols-3'>

      {/* Navbar */}
      <div id='navbar' className="col-span-1 h-full border-red-600 border border-solid grid grid-rows-10">
        {/* User details and profile button */}
        <div className="grid grid-rows-2 row-span-1">
          <div className="grid grid-cols-3">
            <img className='size-12' src={`${USER_PFP_BASE_URL}/${username}`}/>
            <div className='bg-green-600'>{username}</div>
            <Link className='bg-green-400' to='/profile'>Profile</Link>
          </div>
        </div>

        {/* contacts container */}
        <div id='contacts-container' className='flex flex-col gap-4 row-span-7'>
          {conversations.map((conversationElement) => {
            return (
              <div key={conversationElement.id}>
                <div className={'grid grid-cols-4' + hoverTransitionClassName} onClick={() => openConversation(conversationElement.id, conversationElement.type)}>
                  <img className='bg-green-400 col-span-1' src={ (conversationElement.type=='user' ? USER_PFP_BASE_URL : GROUP_PIC_BASE_URL ) + `/${conversationElement.id}`} id={"img-"+conversationElement.id}/>
                  <div className='bg-yellow-400 col-span-2 grid grid-rows-2'>
                    <span>{conversationElement.display_name}</span>
                    <span>{conversationElement.last_message}</span>
                  </div>
                  {conversationElement.unread > 0 &&
                    <div className='bg-blue-400 col-span-1'>{conversationElement.unread}</div>}

                </div>
              </div>
            )
          })}
        </div>
        <button className='bg-blue-400 p-4 m-4 row-span-1' onClick={openNewMessageModal}>New conversation</button>
        <button onClick={handleLogoutButton} className='bg-gray-300 p-4 m-4 row-span-1'>Logout</button>
      </div>

      {/* Conversations container */}
      <div className="col-span-2 h-full border-blue-600 border border-solid flex flex-col">

        {inConversationWith==null ? 
        <div className='flex-grow'>Select a conversation</div> :
          <div className='flex-grow'>
            {`Entered convo ${selectedConversation.current.id} of type ${selectedConversation.current.type} with id ${selectedConversation.current.id}`}
            <button className='bg-blue-100 p-4' onClick={handleGroupOptionsModal}>Group options</button>
            {messages.map((messageElement) => {
              return (
                <div>
                  <span>{messageElement.sender}</span>
                  <span>{messageElement.text}</span>
                  <span>{messageElement.time_sent}</span>
                </div>
              )
            })
            }
          </div>}

        <div>
          <input
            ref={messageInputRef}
            placeholder='Your message here'
            value={messageInputText}
            onChange={(e) => setMessageInputText(e.target.value)}
            className='bg-gray-100 p-4 m-4 w-3/4'
          />
          <button onClick={handleSendingMessage} ref={sendButtonRef} className='bg-green-100 p-4 m-4'>Send</button>

        </div>
      </div>

      {/* new message modal */}
      {
        newMessageModal && <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-green-200 rounded-xl border border-solid border-black flex flex-col items-center p-4'>
          <span className=''>Start a new conversation with : </span>
          <input className='w-3/5' placeholder='Enter a username or full name'></input>
          <div className="bg-blue-100 w-3/5 h-1/2 flex flex-col gap-4">
            {searchedUsers.map(userElement => {
              return( 
                <div className={'flex border border-solid border-black gap-2 p-2'+hoverTransitionClassName} onClick={()=>openConversation(userElement.username, 'user')}>
                  <img src={`${USER_PFP_BASE_URL}/${userElement.username}`} className='size-12'/>
                  <div>{userElement.display_name}</div>
                  <div>{userElement.username}</div>
                </div>
              )
            })}
          </div>
          <br />
          <span>Or you can </span>
          <br />
          <button onClick={handleNewGroupModal}>Create a new group</button>
          <br />
          <br />
          <button onClick={handleNewMessageModal}>Cancel</button>
        </div>
      }

      {/* new group modal */}
      {
        newGroupModal && <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-green-200 rounded-xl border border-solid border-black flex flex-col items-center p-4'>
          <span className=''>Create a new group </span>
          <input className='w-3/5' placeholder='Enter a group name' value={newGroupNameInputText}
            onChange={(e) => setNewGroupNameInputText(e.target.value)}></input>
          <span>Add your friends!</span>
          <input className='w-3/5' placeholder='Enter a username or full name'></input>
          <div className="bg-blue-100 w-3/5 h-1/2"></div>
          <br/>
          <button onClick={handleCreateNewGroupButton}>Create group</button>
          <br/>
          <button onClick={handleNewGroupModal}>Cancel</button>
        </div>
      }

      {/* group options modal */}
      {
        groupOptionsModal && <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-green-200 rounded-xl border border-solid border-black flex flex-col items-center p-4 gap-8'>
          <input placeholder="Enter a friend's username" value={addFriendByUsernameInputText} onChange={(e) => setAddFriendByUsernameInputText(e.target.value)}></input>
          <br/>
          <button onClick={handleAddFriendButton}>Add friend</button>
          <br/>
          <br/>
          <input type="file" accept="image/*" onChange={handleFileChange}/>
          <button className='bg-blue-200' onClick={handleSubmit}>Update profile picture</button>          
          <button onClick={handleGroupOptionsModal}>Cancel</button>
        </div>
      }

    </div >
  )


}