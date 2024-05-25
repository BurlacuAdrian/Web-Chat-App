import { MENU_STYLE, MOBILE_MENU_STYLE } from './Syles.js'
import { useEffect, useRef, useState } from 'react'
import axiosInstance from '../Auth/axiosConfig'
import { formatUTCDate } from './HelperFunctions'

export default function MessagesContainer({ inConversationWith, messages, switchMenuAndMessageView, openGroupOptionsModal, sendButtonRef, mobileVersion, selectedConversation, username, socketRef, setMessages, setConversations, getConversationRoomId}) {

  const [messageInputText, setMessageInputText] = useState('')
  const messageInputRef = useRef(null)

  const hoverTransitionClassName = ' transition-transform duration-200 hover:-translate-y-1 hover:cursor-pointer'

  const handleSendingMessage = () => {
    if (messageInputText.length == 0)
      return

    socketRef.current.emit("send-mesage", {
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

  return (
    <div id='messages-container' className={"col-span-2 h-full hidden absolute w-full lg:block lg:static " + (mobileVersion ? ' ' : ' ')}>
      <div className='row-span-1 w-full h-[10vh] mt-4'>
        <img id='back-button' src='../back.svg' className={'size-16 inline-block align-middle ml-8 lg:hidden' + hoverTransitionClassName} onClick={switchMenuAndMessageView}></img>
        <span className='ml-6'>Chatting with : {inConversationWith}</span>
        {selectedConversation.current.type == "group" && <button className='bg-blue-100 p-4 ml-16 rounded-lg' onClick={openGroupOptionsModal}>Group options</button>}
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
                  {selectedConversation.current.type == 'group' && messageElement.sender != username && <div className='font-bold'>{messageElement.sender}</div>}
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
  )
}