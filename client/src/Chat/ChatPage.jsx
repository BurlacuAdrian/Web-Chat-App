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
  const [mobileVersion, setMobileVersion] = useState(false)
  const [currentModal, setCurrentModal] = useState(0)
  const [imageSource, setImageSource] = useState(null)


  /*** Socket handling ***/

  const [isConnected, setIsConnected] = useState(socket.connected)

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
    }

    function onDisconnect() {
      console.log("disconnected")
      // if(localStorage.getItem(''))
      // navigate('/login')
      setIsConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    function receiveMessage(messageObj) {
      console.log('received message')

      var { sender, receiver, room_id, text, type, time_sent, file_type, file_path, original_name } = messageObj
      console.log(`room id ${room_id} and selectedConv ${selectedConversation.current.id}`)

      if (type == 'user')
        room_id = sender

      if (room_id == selectedConversation.current.id) {
        //In conversation
        setMessages(oldMessages => {
          const newMessages = [...oldMessages]
          newMessages.push(messageObj)
          console.log(messageObj)
          return newMessages
        })
        return
      }

      setConversations(oldValue => {

        const newValue = [...oldValue]

        var found = false
        newValue.forEach(conversationElement => {
          if (conversationElement.id == sender)
            found = true
        })

        //check if the conversation/group was in the navbar before
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
          if ( (type == 'user' && conversation.id === sender) || (conversation.id === receiver) ) {
              return { ...conversation, unread: conversation.unread == 0 ? 1 : conversation.unread++, last_message: text };
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
    const response = await axiosInstance.get(`/messages/${selectedConversation.current.type}/${selectedConversation.current.id}`)
    // console.log(`getting messages from a ${selectedConversation.current.type}`)
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

  const getUserStatus = async (userId) => {
    const result = await axiosInstance.get(`status/${userId}`)
    const data = await result.data
    return data
  }

  const openConversation = async (conversationId, conversationType) => {
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
    if (selectedConversation.current.id != null) {
      if (selectedConversation.current.type === "user") {
        updateInteractions(selectedConversation.current.id)
      } else {//GROUP
        updateGroupInteraction(selectedConversation.current.id)
      }
    }

    //Update state and reference variables
    selectedConversation.current = { id: conversationId, type: conversationType, room_id: conversationId }
    setInConversationWith(conversationId)

    //For *current* conversation : Update group or user interactions
    if (conversationType === "user") {
      updateInteractions(selectedConversation.current.id)
    } else {//GROUP
      updateGroupInteraction(selectedConversation.current.id)
    }

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

  //TODO update
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