import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom';

export default function ChatPage({ setLoggedIn }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("our username")
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [messageInputText, setMessageInputText] = useState('');
  const messageInputRef = useRef(null);
  const sendButtonRef = useRef(null)


  const hoverTransitionClassName = ' transition-transform duration-200 hover:-translate-y-1 hover:cursor-pointer'

  const handleSendingMessage = () => {
    if (messageInputText.length == 0)
      return
    console.log('Sending message:', messageInputText);

    setMessageInputText('');

    messageInputRef.current.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendButtonRef.current.click()
    }
  };

  const openConversation = (conversationId) => {
    setSelectedConversation(conversationId)
    setMessages(conversations.filter(conversationElement => conversationElement.id == conversationId)[0].messages)
    console.log(conversations.filter(conversationElement => conversationElement.id == conversationId)[0].messages)
  }

  //placeholder
  useEffect(() => {
    setConversations([
      { id: 1, display_name: "User 1", last_message: "Hey", unread: 0, messages: [{ sender: "User 1", recipient: "User test", text: "Message 1", time_sent: "time" }] },
      { id: 2, display_name: "User 2", last_message: "Hey", unread: 2, messages: [{ sender: "User 2", recipient: "User test", text: "Message 2", time_sent: "time" }] },
      { id: 3, display_name: "User 3", last_message: "Hey", unread: 3, messages: [{ sender: "User 3", recipient: "User test", text: "Message 3", time_sent: "time" }] }])

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };

  }, [])



  

  

  return (
    <div id='container' className='w-full h-full grid grid-cols-3'>

      {/* Navbar */}
      <div id='navbar' className="col-span-1 h-full border-red-600 border border-solid">
        <div className="h-full grid grid-rows-2">
          <div className="">{username}</div>
          <div id='conversations-container' className='grid gap-2'>
            {conversations.map((conversationElement) => {
              return (
                <div className={'grid grid-cols-4' + hoverTransitionClassName} onClick={() => openConversation(conversationElement.id)}>
                  <div className='bg-green-400 col-span-1'>PFP</div>
                  <div className='bg-yellow-400 col-span-2 grid grid-rows-2'>
                    <span>{conversationElement.display_name}</span>
                    <span>{conversationElement.last_message}</span>
                  </div>
                  {conversationElement.unread > 0 &&
                    <div className='bg-blue-400 col-span-1'>{conversationElement.unread}</div>}

                </div>
              )
            })}
          </div>
        </div>
        <div className=""></div>
      </div>

      {/* Conversations container */}
      <div className="col-span-2 h-full border-blue-600 border border-solid flex flex-col">

        {!selectedConversation ? <div>Select a conversation</div> :
          <div className='flex-grow'>
            {"Entered convo " + selectedConversation}
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
          />
          <button onClick={handleSendingMessage} ref={sendButtonRef}>Send</button>
        </div>
      </div>
    </div>
  )


}