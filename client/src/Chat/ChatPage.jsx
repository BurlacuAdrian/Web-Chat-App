import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { socket } from './socket'
import axiosInstance from '../Auth/axiosConfig'
import { MENU_STYLE, MOBILE_MENU_STYLE } from './Syles.js'
import GroupOptionsModal from './Modals/GroupOptionsModal.jsx'
import NewGroupModal from './Modals/NewGroupModal.jsx'
import NewConversationModal from './Modals/NewConversationModal.jsx'
import MessagesContainer from './MessagesContainer.jsx'
import NavBar from './NavBar.jsx'
import ViewImageModal from './Modals/ViewImageModal.jsx'
import AttachmentsModal from './Modals/AttachmentsModal.jsx'

export default function ChatPage({ setLoggedIn }) {
  const navigate = useNavigate()

  const [username, setUsername] = useState(localStorage.getItem('username'))
  const [displayName, setDisplayName] = useState(username)
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const sendButtonRef = useRef(null)
  const socketRef = useRef(null)
  const selectedConversation = useRef({ id: null })
  const [inConversationWith, setInConversationWith] = useState(null)
  const [reloadImage, setReloadImage] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [navbar, setNavBar] = useState(false)
  const [mobileVersion, setMobileVersion] = useState(0)
  const [currentModal, setCurrentModal] = useState(0)
  const [imageSource, setImageSource] = useState(null)
  const MOBILE_PX_THRESHOLD = 1102


  /*** Socket handling ***/

  const [isConnected, setIsConnected] = useState(socket.connected)

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
    }

    function onDisconnect() {
      console.log("disconnected")
      setIsConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    async function receiveMessage(messageObj) {
      const { sender, receiver, room_id, text, type, time_sent, file_type, file_path, original_name } = messageObj;
    
      const effectiveRoomId = type === 'user' ? sender : room_id;
    
      // Update messages if we're in the conversation
      if (effectiveRoomId === selectedConversation.current.id) {
        setMessages(oldMessages => [...oldMessages, messageObj]);
        console.log(messageObj);
      }
    
      // Always update the conversations list
      setConversations(oldValue => {
        const newValue = [...oldValue];
    
        const found = newValue.some(conversationElement => conversationElement.id === effectiveRoomId);
    
        // Check if the conversation/group was in the navbar before
        if (!found) {
          newValue.push({
            id: effectiveRoomId,
            type,
            display_name: effectiveRoomId,
            last_message: text,
            unread: effectiveRoomId === selectedConversation.current.id ? 0 : 1,
            online: type === 'user' ? true : undefined
          });
    
          // Use IIFE to handle async operation
          (async () => {
            try {
              const response = await axiosInstance.get(`display_name/${effectiveRoomId}`);
              setConversations(oldConvos => 
                oldConvos.map(convo => 
                  convo.id === effectiveRoomId ? { ...convo, display_name: response.data } : convo
                )
              );
            } catch (error) {
              console.error('Error fetching display name:', error);
            }
          })();
        }
    
        return newValue.map(conversation => {
          if (conversation.id === effectiveRoomId) {
            return { 
              ...conversation, 
              unread: effectiveRoomId === selectedConversation.current.id 
                ? conversation.unread 
                : conversation.unread + 1, 
              last_message: text 
            };
          }
          return conversation;
        });
      });
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

    const failedToken = () => {
      socket.disconnect()
      navigate('/login')
    }

    socket.on('receive-message', receiveMessage)
    socket.on('failed-token', failedToken)
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
      socket.off('failed-token', failedToken)
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

  const getConversationRoomId = (username1, username2) => {
    const sortedUsernames = [username1, username2].sort()
    const concatenatedUsernames = sortedUsernames.join('-')
    return concatenatedUsernames;
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    }
  })

  const resetCurrentConversation = () => {

    handleUpdateInteractions()

    selectedConversation.current = { id: null }
    setInConversationWith(null)
  }

  /*** Utils end ***/


  /*** Page load handling ***/

  const handleResize = () => {

    const messagesContainer = document.getElementById('messages-container')
    const navbar = document.getElementById('navbar')
    if (window.innerWidth < MOBILE_PX_THRESHOLD) {
      resetCurrentConversation()
      setMobileVersion(1)
      return
    }

    setMobileVersion(0)
  }

  useEffect(() => {
    getConversationsFromAPI()
    getOwnDisplayName()
    window.addEventListener('resize', handleResize)

    if (window.innerWidth < MOBILE_PX_THRESHOLD) {
      setMobileVersion(1)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  /*** Page load handling end***/

  /*** API interaction ***/

  const getMessagesFromAPI = async () => {
    const response = await axiosInstance.get(`/messages/${selectedConversation.current.type}/${selectedConversation.current.id}`)
    // console.log(`getting messages from a ${selectedConversation.current.type}`)
    const data = await response.data
    setMessages(data)
  }

  const getConversationsFromAPI = async () => {
    const response = await axiosInstance.get('/conversations')
    const data = await response.data
    //TODO check layout
    //debug
    const newss = [...data, ...data, ...data]
    setConversations(newss)
    // setConversations(data)
    console.log(data)
    data.forEach(conversationElement => {
      // console.log(conversationElement)
      if (conversationElement.type == 'group') {
        socketRef.current.emit('join-room', { room_id: conversationElement.id, conversationType: conversationElement.type })
      }
    })
    // return data
  }

  const handleUpdateInteractions = () => {
    if (selectedConversation.current.id != null) {
      if (selectedConversation.current.type === "user") {
        updateInteractions(selectedConversation.current.id)
      } else {//GROUP
        updateGroupInteraction(selectedConversation.current.id)
      }
    }
  }

  const updateInteractions = async (conversationId) => {
    const response = await axiosInstance.put(`/interaction/${conversationId}`)
  }

  const updateGroupInteraction = async (conversationId) => {
    const response = await axiosInstance.put(`/group/${conversationId}`)
  }

  const getUserStatus = async (userId) => {
    const result = await axiosInstance.get(`status/${userId}`)
    const data = await result.data
    return data
  }

  const openConversation = async (conversationId, conversationType, displayName) => {
    switchMenuAndMessageView()
    Modals.closeModal()

    var room_id

    //Determine room id
    if (conversationType === "user") {
      const secondUsername = conversationId
      room_id = getConversationRoomId(username, secondUsername)
    } else {//GROUP
      room_id = conversationId
    }

    //For *previous* conversation : Update group or user interactions
    handleUpdateInteractions()

    //Update state and reference variables
    selectedConversation.current = { id: conversationId, type: conversationType, room_id: conversationId, display_name: displayName }
    setInConversationWith(conversationId)

    //For *current* conversation : Update group or user interactions
    handleUpdateInteractions()

    //Check if conversation is in the contacts container
    var found = false

    conversations.forEach(conversationElement => {
      if (conversationElement.id == conversationId)
        found = true
    })

    if (!found) {

      const onlineState = (conversationType == 'group' ? false : (await getUserStatus(conversationId)))
      setConversations(oldValue => {
        const newValue = [...oldValue]
        newValue.push({
          id: conversationId,
          type: conversationType,
          display_name: conversationId,
          last_message: "",
          unread: 0,
          online: onlineState
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
          return { ...conversation, unread: 0 };
        }
        return conversation;
      });
    });
  }

  const getOwnDisplayName = async () => {
    const response = await axiosInstance.get(`/display_name/${username}`)
    setDisplayName(response.data)
  }

  /*** API interaction end***/



  /*** Modal and button handling ***/

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendButtonRef.current.click()
    }
  };

  const handleDarkModeToggle = () => {
    setDarkMode(oldValue => !oldValue)
    document.body.classList.toggle('dark')
  }

  const handleToggleNavbar = () => {
    setNavBar(oldValue => !oldValue)
    document.getElementById('navbar').classList.toggle('hidden')
  }

  const switchMenuAndMessageView = () => {

    switch (mobileVersion) {
      case 1://Swtich from contacts view to messages
        setMobileVersion(2)
        break;
      case 2://Swtich from messages view to contacts
        setMobileVersion(1)
        resetCurrentConversation()
        break;
    
      default:
        break;
    }

  }

  /*** Modal and button handling end ***/

  const Modals = Object.freeze({
    closeModal: () => {
      setCurrentModal(0)
    },
    openModal: (modalId) => {
      setCurrentModal(modalId)
    },
    GroupOptionsModal: 1,
    NewGroupModal: 2,
    NewConversationModal: 3,
    ViewImageModal: 4,
    AttachmentsModal: 5
  });

  return (
    <div id='container' className={' grid grid-cols-3 h-full bg-zinc-50 dark:bg-slate-900 overflow-hidden '}>

      <NavBar
        openConversation={openConversation}
        conversations={conversations}
        username={username}
        navigate={navigate}
        mobileVersion={mobileVersion}
        displayName={displayName}
        openNewConversationsModal={() => Modals.openModal(Modals.NewConversationModal)}
      />

      <MessagesContainer
        inConversationWith={inConversationWith}
        messages={messages}
        switchMenuAndMessageView={switchMenuAndMessageView}
        openGroupOptionsModal={() => Modals.openModal(Modals.GroupOptionsModal)}
        sendButtonRef={sendButtonRef}
        mobileVersion={mobileVersion}
        setMobileVersion={setMobileVersion}
        selectedConversation={selectedConversation}
        username={username}
        socketRef={socketRef}
        setMessages={setMessages}
        setConversations={setConversations}
        getConversationRoomId={getConversationRoomId}
        openImageModal={() => Modals.openModal(Modals.ViewImageModal)}
        openAttachmentsModal={() => Modals.openModal(Modals.AttachmentsModal)}
        setImageSource={setImageSource}
        closeModal={Modals.closeModal}
      />

      {currentModal != 0 && (
        <div className='w-full h-full absolute bg-dim-overlay'>
          {currentModal === Modals.GroupOptionsModal && (
            <GroupOptionsModal
              selectedConversation={selectedConversation}
              closeModal={Modals.closeModal}
              setMessages={setMessages}
              setInConversationWith={setInConversationWith}
              setConversations={setConversations}
              mobileVersion={mobileVersion}
              conversations={conversations}
              socketRef={socketRef}
            />
          )}

          {currentModal === Modals.NewGroupModal && (
            <NewGroupModal
              closeModal={Modals.closeModal}
              openConversation={openConversation}
              mobileVersion={mobileVersion}
            />
          )}

          {currentModal === Modals.AttachmentsModal && (
            <AttachmentsModal
              closeModal={Modals.closeModal}
              mobileVersion={mobileVersion}
              socketRef={socketRef}
              selectedConversation={selectedConversation}
              username={username}
              setMessages={setMessages}
              setConversations={setConversations}
            />
          )}

          {currentModal === Modals.ViewImageModal && (
            <ViewImageModal
              closeModal={Modals.closeModal}
              mobileVersion={mobileVersion}
              imageSource={imageSource}
            />
          )}

          {currentModal === Modals.NewConversationModal && (
            <NewConversationModal
              closeModal={Modals.closeModal}
              openConversation={openConversation}
              openNewGroupModal={() => Modals.openModal(Modals.NewGroupModal)}
              mobileVersion={mobileVersion}
            />
          )}


        </div>
      )}

    </div >
  )

}