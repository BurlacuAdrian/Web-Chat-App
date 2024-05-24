import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { socket } from './socket'
import axiosInstance from '../Auth/axiosConfig'

export default function ChatPage({ setLoggedIn }) {
  const navigate = useNavigate()

  const [username, setUsername] = useState(localStorage.getItem('username'))
  const [displayName, setDisplayName] = useState(username)
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [messageInputText, setMessageInputText] = useState('')
  const [newMessageModal, setNewMessageModal] = useState(false)
  const [newGroupModal, setNewGroupModal] = useState(false)
  const [searchedUsers, setSearchedUsers] = useState([])
  const messageInputRef = useRef(null)
  const sendButtonRef = useRef(null)
  const socketRef = useRef(null)
  const selectedConversation = useRef({ id: null })
  const [inConversationWith, setInConversationWith] = useState(null)
  const [newGroupNameInputText, setNewGroupNameInputText] = useState('')
  const [groupOptionsModal, setGroupOptionsModal] = useState(false)
  const [addFriendByUsernameInputText, setAddFriendByUsernameInputText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [reloadImage, setReloadImage] = useState(false)
  const [searchText, setSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [groupMembers, setGroupMembers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [navbar, setNavBar] = useState(false)
  const [mobileVersion, setMobileVersion] = useState(false)

  const USER_PFP_BASE_URL = 'http://localhost:8080/api/v1/profile_picture'
  const GROUP_PIC_BASE_URL = 'http://localhost:8080/api/v1/group_picture'

  const MENU_STYLE = " border-2 border-solid border-blue-900 z-10 "
  const MOBILE_MENU_STYLE = ' border-2 w-4/5 h-4/5'

  /*** Socket handling ***/

  const [isConnected, setIsConnected] = useState(socket.connected)

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
    }

    function onDisconnect() {
      setIsConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    function receiveMessage(messageObj) {
      console.log('received message')

      let { sender, receiver, room_id, text, type, time_sent } = messageObj
      console.log(`room id ${room_id} and selectedConv ${selectedConversation.current.id}`)

      if (type == 'user')
        room_id = sender

      if (room_id == selectedConversation.current.id) {
        //In conversation
        setMessages(oldMessages => {
          const newMessages = [...oldMessages]
          newMessages.push(messageObj)
          return newMessages
        })
      } else {
        setConversations(oldValue => {

          const newValue = [...oldValue]

          var found = false
          newValue.forEach(conversationElement => {
            if (conversationElement.id == sender)
              found = true
          })

          if (!found) {
            axiosInstance.get(`display_name/${sender}`).then(response => {
              //TODO review this
              setConversations(oldConvos => {
                const newConvos = [...oldConvos]
                return newConvos.map(convo => {
                  if (convo.id == sender) {
                    convo.display_name = response.data
                  }
                  return convo
                })
              })
            })
            newValue.push({
              id: sender,
              type,
              display_name: sender,
              last_message: text,
              unread: 1,
              online: true
            })
          }

          return newValue.map(conversation => {
            if (type == 'user') {
              if (conversation.id === sender) {
                return { ...conversation, unread: conversation.unread == 0 ? 1 : conversation.unread++, last_message: text };
              }
            } else {
              if (conversation.id === receiver) {
                return { ...conversation, unread: conversation.unread == 0 ? 1 : conversation.unread++, last_message: text };
              }
            }

            return conversation;
          });
        });
      }



    }

    function onFriendConnected({ friend_username }) {
      // console.log(friend_username + 'connected!')
      setConversations(oldValue => {
        return oldValue.map(conversation => {
          if (conversation.id === friend_username) {
            return { ...conversation, online: true };
          }
          return conversation;
        });
      });
    }

    function onFriendDisconnected({ friend_username }) {
      // console.log(friend_username + 'disconnected!')

      setConversations(oldValue => {
        return oldValue.map(conversation => {
          if (conversation.id === friend_username) {
            return { ...conversation, online: false };
          }
          return conversation;
        });
      })
    }

    function handleBeingAddedToGroup(roomObj) {
      socketRef.current.emit('join-room', { room_id: roomObj.id, conversationType: "group" })
      setConversations(oldValue => {
        return [...oldValue, roomObj]
      })
    }

    socket.on('receive-message', receiveMessage)

    socket.on('friend-connected', onFriendConnected)
    socket.on('friend-disconnected', onFriendDisconnected)
    socket.on('added-to-group', handleBeingAddedToGroup)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)

      socket.off('friend-connected', onFriendConnected)
      socket.off('friend-disconnected', onFriendDisconnected)
      socket.off('added-to-group', handleBeingAddedToGroup)

      socket.off('receive-message', receiveMessage)

      // if(selectedConversation.current.id!=null){
      //   socket.emit('left-conversation', {conversation_id:selectedConversation.current.id, type: selectedConversation.current.type})
      // }
    }
  }, [])

  useEffect(() => {
    // no-op if the socket is already connected
    socket.connect()
    socketRef.current = socket
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  /*** Socket handling end ***/

  /*** Utils ***/

  const hoverTransitionClassName = ' transition-transform duration-200 hover:-translate-y-1 hover:cursor-pointer'

  const getConversationRoomId = (username1, username2) => {
    const sortedUsernames = [username1, username2].sort()
    const concatenatedUsernames = sortedUsernames.join('-')
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

    if (selectedConversation.current.type == 'user') {
      console.log('enter here')
      const messageObj = {
        sender: username,
        receiver: selectedConversation.current.id,
        room_id: getConversationRoomId(selectedConversation.current.id, username),
        text: messageInputText,
        type: selectedConversation.current.type,
        time_sent: new Date()
      }

        setMessages(oldMessages => {
          const newMessages = [...oldMessages]
          newMessages.push(messageObj)
          return newMessages
        })

    }

    setConversations(oldValue => {

      const newValue = [...oldValue]

      var found = false
      newValue.forEach(conversationElement => {
        if (conversationElement.id == username)
          found = true
      })

      return newValue.map(conversation => {
        if (conversation.id === selectedConversation.current.id) {
          return { ...conversation, last_message: messageInputText };
        }

        return conversation;
      });
    });
    setMessageInputText('');

    messageInputRef.current.focus();

  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    }
  })

  function formatUTCDate(utcDate) {
    const date = new Date(utcDate);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    const hour = date.getHours();
    const minutes = date.getMinutes();

    const formattedHour = hour < 10 ? '0' + hour : hour;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const daySuffix = getDaySuffix(date.getDate());
    return `${formattedHour}:${formattedMinutes}, ${day}${getDaySuffix(day)} of ${month} ${year}`
  }

  function getDaySuffix(day) {
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  /*** Utils end ***/



  /*** Page load handling ***/

  const handleResize = () => {

    const messagesContainer = document.getElementById('messages-container')
    const navbar = document.getElementById('navbar')
    if (window.innerWidth < 768) {
      //TODO exit current conversation, update selectedConversation, inConversationWith etc
      messagesContainer.style.display = 'none'
      navbar.style.display = 'block'
      setMobileVersion(true)
      return
    }


    setMobileVersion(false)
    messagesContainer.style.display = 'block'
    navbar.style.display = 'block'
  }

  useEffect(() => {
    getConversationsFromAPI()
    getOwnDisplayName()
    window.addEventListener('resize', handleResize)
    // const data = await getConversationsFromAPI()
    // console.log(data)
    // setConversations(data)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

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
    console.log(data)
    data.forEach(conversationElement => {
      // console.log(conversationElement)
      if (conversationElement.type == 'group') {
        socketRef.current.emit('join-room', { room_id: conversationElement.id, conversationType: conversationElement.type })
      }
    })
    // return data
  }

  const updateInteractions = async (conversationId) => {
    const response = await axiosInstance.put(`/interaction/${conversationId}`)
  }

  const updateGroupInteraction = async (conversationId) => {
    const response = await axiosInstance.put(`/group/${conversationId}`)
  }

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

  const openConversation = (conversationId, conversationType) => {
    switchMenuAndMessageView()
    setNewGroupModal(false)
    setNewMessageModal(false)

    let room_id

    if (conversationType === "user") {
      const secondUsername = conversationId
      room_id = getConversationRoomId(username, secondUsername)
    } else {//GROUP
      room_id = conversationId
    }

    if (selectedConversation.current.id != null) {
      if (selectedConversation.current.type === "user") {
        updateInteractions(selectedConversation.current.id)
      } else {//GROUP
        updateGroupInteraction(selectedConversation.current.id)
      }
    }

    selectedConversation.current = { id: conversationId, type: conversationType, room_id: conversationId }
    setInConversationWith(conversationId)

    if (conversationType === "user") {
      updateInteractions(selectedConversation.current.id)
    } else {//GROUP
      updateGroupInteraction(selectedConversation.current.id)
    }

    var found = false

    conversations.forEach(conversationElement => {
      if (conversationElement.id == conversationId)
        found = true
    })

    if (!found) {
      setConversations(oldValue => {
        const newValue = [...oldValue]
        newValue.push({
          id: conversationId,
          type: conversationType,
          display_name: conversationId,
          last_message: "",
          unread: 0,
          online: false
        })
        return newValue
      })
    }

    getMessagesFromAPI()

    let roomObj = {
      room_id: room_id,
      conversationType: conversationType
    }

    if (conversationType == 'user')
      roomObj.withUser = conversationId

    socket.emit('join-room', roomObj)
    socket.emit('current-room', roomObj)

    setConversations(oldValue => {
      return oldValue.map(conversation => {
        if (conversation.id === conversationId) {
          return { ...conversation, unread:0 };
        }
        return conversation;
      });
    });
  }

  const updateSearchedUsers = async () => {
    const response = await axiosInstance.get("/users")
    const data = await response.data
    setSearchedUsers(data)
  }

  const getGroupMembers = async (groupId) => {
    const response = await axiosInstance.get(`/group_members/${groupId}`)
    const data = await response.data
    setGroupMembers(data)
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

  const getOwnDisplayName = async () => {
    const response = await axiosInstance.get(`/display_name/${username}`)
    setDisplayName(response.data)
  }

  /*** API interaction end***/



  /*** Modal and button handling ***/


  const openNewMessageModal = async () => {
    setNewMessageModal(true)
    updateSearchedUsers()
  }


  const handleNewMessageModal = () => {
    setNewMessageModal(oldValue => !oldValue)
    setSearchText("")
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
    setGroupOptionsModal(oldValue => !oldValue)
    // updateSearchedUsers()
    getGroupMembers(selectedConversation.current.id)
  }

  const handleAddFriendButton = () => {
    setGroupOptionsModal(false)
    addFriendToGroup(addFriendByUsernameInputText)
    setAddFriendByUsernameInputText('')
  }

  const handleAddFriendToGroup = (friendName) => {
    //TODO check if successful
    addFriendToGroup(friendName)
    setGroupOptionsModal(false)
  }

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
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

  const handleLeavingGroup = () => {
    leaveGroup()
    setGroupOptionsModal(false)
  }

  const handleDarkModeToggle = () => {
    setDarkMode(oldValue => !oldValue)
    document.body.classList.toggle('dark')
  }

  const handleToggleNavbar = () => {
    setNavBar(oldValue => !oldValue)
    document.getElementById('navbar').classList.toggle('hidden')
  }


  const switchMenuAndMessageView = () => {
    const backButton = document.getElementById('back-button')
    const backButtonStyle = window.getComputedStyle(backButton)

    if (backButtonStyle.display == 'none')
      return

    const messagesContainer = document.getElementById('messages-container')
    const navbar = document.getElementById('navbar')

    const navBarStyle = window.getComputedStyle(navbar)

    if (navBarStyle.display == 'none') {
      navbar.style.display = 'inline-block'
      messagesContainer.style.display = 'none'
    } else {
      navbar.style.display = 'none'
      messagesContainer.style.display = 'inline-block'
    }
  }

  /*** Modal and button handling end ***/


  /*** Search and filter users handling ***/

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

  /*** Search and filter users handling end ***/


  return (
    <div id='container' className={' grid grid-cols-3 h-full bg-zinc-50 dark:bg-slate-900 overflow-hidden '}>

      {/* Navbar */}
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
        <div id='contacts-container' className='overflow-y-auto flex flex-col gap-2 h-[80%] mt-12'>
          {conversations.map((conversationElement) => {
            return (
              <div key={conversationElement.id}>
                <div className={'grid grid-cols-4 pl-2' + hoverTransitionClassName} onClick={() => openConversation(conversationElement.id, conversationElement.type)}>
                  <img className='bg-green-400 rounded-lg col-span-1 size-16' src={(conversationElement.type == 'user' ? USER_PFP_BASE_URL : GROUP_PIC_BASE_URL) + `/${conversationElement.id}`} id={"img-" + conversationElement.id} />
                  <div className='ml-4 pl-4 pt-4 pb-4 col-span-2 grid grid-rows-2 bg-blue-100 rounded-lg '>
                    <div>
                      <span className='font-bold'>{conversationElement.display_name} </span>
                      <span>{(conversationElement.hasOwnProperty('online') ? (conversationElement.online ? 'online' : 'offline') : '')}</span>
                    </div>

                    <span className=''>{(!!conversationElement.last_message && conversationElement.last_message.length) <= 10 ? conversationElement.last_message : conversationElement.last_message.substring(0, 10) + '...'}</span>
                  </div>
                  {conversationElement.unread > 0 &&
                    <div className='col-span-1 flex items-center text-center'>{`${conversationElement.unread} unread message` + (conversationElement.unread == 1 ? '' : 's')}</div>}

                </div>
              </div>
            )
          })}
        </div>

        <div className={'mt-auto bottom-0 absolute'}>
          <button onClick={handleLogoutButton} className='bg-gray-300 p-4 m-4 ml-8 rounded-lg'>Logout</button>
          <button className='bg-blue-400 p-12 m-4 rounded-lg' onClick={openNewMessageModal}>New conversation</button>
          {/* <img src='../sun.svg' className={'size-16 inline-block align-middle ml-8 '+hoverTransitionClassName} onClick={handleDarkModeToggle}></img> */}
        </div>
      </div>

      {/* Messages container */}
      <div id='messages-container' className={"col-span-2 h-full hidden absolute w-full lg:block lg:static "+ (mobileVersion? ' ':' ')}>
        <div className='row-span-1 w-full h-[10vh] mt-4'>
          <img id='back-button' src='../back.svg' className={'size-16 inline-block align-middle ml-8 lg:hidden' + hoverTransitionClassName} onClick={switchMenuAndMessageView}></img>
          <span className='ml-6'>Chatting with : {inConversationWith}</span>
          {selectedConversation.current.type == "group" && <button className='bg-blue-100 p-4 ml-16 rounded-lg' onClick={handleGroupOptionsModal}>Group options</button>}
        </div>
        <div className=''>
          {inConversationWith == null ?
            <div className='text-center relative top-1/2 text-xl animate-sinus leading-10 '>
              <b>Hint : </b>Select a conversation
              <br />from the menu on the left
              <br />or click 'New conversation'
            </div> :
            <div className='gap-3 overflow-y-scroll h-[80vh] flex flex-col pl-4 pr-4'>

              {messages.map((messageElement) => {
                return (
                  <div className={'bg-blue-100 w-2/3 rounded-xl p-4 h-auto whitespace-normal flex flex-col flex-wrap' + (messageElement.sender == username ? ' ml-auto mr-4 bg-green-100' : '')}>
                    {selectedConversation.current.type=='group' && messageElement.sender!=username && <div className='font-bold'>{messageElement.sender}</div>}
                    <span className='break-words max-w-full'>{messageElement.text}</span>
                    <div className=''>Sent at : {formatUTCDate(messageElement.time_sent)}</div>
                  </div>
                )
              })
              }
              <div className='absolute bottom-0 grid grid-cols-4 lg:w-3/5 ml-auto w-11/12'>
                <input
                  ref={messageInputRef}
                  placeholder='Your message here'
                  value={messageInputText}
                  onChange={(e) => setMessageInputText(e.target.value)}
                  className='bg-gray-100 p-4 m-4 w-6/8 col-span-3 rounded-lg'
                />
                <button onClick={handleSendingMessage} ref={sendButtonRef} className='bg-green-200 p-4 m-4 col-span-1 rounded-lg'>Send</button>

              </div>
            </div>}
        </div>
      </div>

      {/* new message modal */}
      {
        newMessageModal && <div className={'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-3/5 bg-blue-100 rounded-xl flex flex-col items-center p-4 '+MENU_STYLE + (mobileVersion? MOBILE_MENU_STYLE:'')}>
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
          <button onClick={handleNewGroupModal} className='button-main mt-4'>Create a new group</button>
          <button onClick={handleNewMessageModal} className='button-main mt-4'>Cancel</button>
        </div>
      }

      {/* new group modal */}
      {
        newGroupModal && <div className={'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-3/5 bg-blue-100 rounded-xl flex flex-col items-center p-4 pt-8 pb-8 justify-around'+MENU_STYLE+ (mobileVersion? MOBILE_MENU_STYLE:'')}>
          <span className=''>Create a new group </span>
          <input className='w-3/5 input-main' placeholder='Enter a group name' value={newGroupNameInputText}
            onChange={(e) => setNewGroupNameInputText(e.target.value)}></input>
          {/* <span>Add your friends!</span>
          <input className='w-3/5' placeholder='Enter a username or full name'></input> */}
          {/* <div className="bg-blue-100 w-3/5 h-1/2"></div> */}
          <br />
          <button onClick={handleCreateNewGroupButton} className='button-main'>Create group</button>
          <br />
          <button onClick={handleNewGroupModal} className='button-main'>Cancel</button>
        </div>
      }

      {/* group options modal */}
      {
        groupOptionsModal &&
        <div className={'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-3/5 bg-blue-100 rounded-xl grid grid-cols-2 grid-rows-1 gap-x-12 '+MENU_STYLE+ (mobileVersion? MOBILE_MENU_STYLE:'')}>
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
            <button onClick={handleGroupOptionsModal} className='button-main'>Cancel</button>
          </div>

        </div>
      }

    </div >
  )


}