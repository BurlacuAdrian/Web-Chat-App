import { MENU_STYLE, MOBILE_MENU_STYLE } from './Syles.js'
import { useEffect, useRef, useState } from 'react'
import axiosInstance from '../Auth/axiosConfig'
import { formatUTCDate } from './HelperFunctions'

export default function MessagesContainer({ inConversationWith, messages, switchMenuAndMessageView, openGroupOptionsModal, sendButtonRef, mobileVersion, setMobileVersion, selectedConversation, username, socketRef, setMessages, setConversations, getConversationRoomId, openImageModal, openAttachmentsModal, setImageSource, closeModal }) {

  const DOWNLOAD_BASE_URL = 'http://localhost:8080/api/v1/download'

  const [messageInputText, setMessageInputText] = useState('')
  const messageInputRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const hoverTransitionClassName = ' transition-transform duration-200 hover:-translate-y-1 hover:cursor-pointer'


  const handleDownload = (file_path, original_name) => {
    fetch(file_path)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        //TODO update download name
        link.setAttribute('download', original_name);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch(error => console.error('Download failed:', error));
  };

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
        time_sent: new Date(),
        file_path: null,
        file_type: null
      }

      setMessages(oldMessages => {
        const newMessages = [...oldMessages]
        newMessages.push(messageObj)
        return newMessages
      })

    }

    setConversations(oldValue => {

      const newValue = [...oldValue]

      //TODO remove
      // var found = false
      // newValue.forEach(conversationElement => {
      //   if (conversationElement.id == username)
      //     found = true
      // })

      const updatedValues =  newValue.map(conversation => {
        if (conversation.id === selectedConversation.current.id) {
          return { ...conversation, last_message: messageInputText };
        }

        return conversation;
      });
      return updatedValues
    });
    setMessageInputText('');

    messageInputRef.current.focus();

  }

  const handleOpenImageModal = (imageSrc) => {
    setImageSource(imageSrc)
    openImageModal(imageSrc)
  }

  const scrollToBottom = (options) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const getFileDisplayType = (fileType) => {
    switch (fileType) {
      case 'application/pdf':
        return 'PDF'
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx'
      case 'application/vnd.oasis.opendocument.text':
        return 'odt'
      default:
        return fileType;
    }
  }


  useEffect(() => {

    setTimeout(() => {
      scrollToBottom()
    }, 50)


    const handleDragEnter = (event) => {
      event.preventDefault();
      openAttachmentsModal()
    };

    const handleDragLeave = (event) => {
      event.preventDefault();
      // closeModal()
    };

    const handleDrop = (event) => {
      event.preventDefault();
    };

    const messagesContainer = document.getElementById('messages-container');

    messagesContainer.addEventListener('dragenter', handleDragEnter);
    messagesContainer.addEventListener('dragleave', handleDragLeave);
    messagesContainer.addEventListener('drop', handleDrop);

    return () => {
      messagesContainer.removeEventListener('dragenter', handleDragEnter);
      messagesContainer.removeEventListener('dragleave', handleDragLeave);
      messagesContainer.removeEventListener('drop', handleDrop);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollToBottom()
    }, 50)
  }, [messages, inConversationWith])

  const getMobileStyle = (mobileVersion) => {
    switch (mobileVersion) {
      case 0:
        return ''
      case 1:
        return '!hidden'
      case 2:
        return '!col-span-3'
      default:
        break;
    }
  }

  return (
    <div id='messages-container' className={"col-span-2 h-full w-full block " + (getMobileStyle(mobileVersion))}>

      {inConversationWith == null ?
        (<div className='text-center relative top-1/2 text-xl animate-sinus leading-10 '>
          <b>Hint : </b>Select a conversation
          <br />from the menu on the left
          <br />or click 'New conversation'
        </div>) :
        (
          <div className=''>
            <div className='row-span-1 w-full h-[10vh] mt-4'>
              <img id='back-button' src='../back.svg' className={'size-16 inline-block align-middle ml-8 lg:hidden' + hoverTransitionClassName} onClick={switchMenuAndMessageView}></img>
              <span className='ml-6'>Chatting with : {selectedConversation.current.display_name}</span>
              {selectedConversation.current.type == "group" && <button className='bg-blue-100 p-4 ml-16 rounded-lg' onClick={openGroupOptionsModal}>Group options</button>}
            </div>
            <div className='gap-3 overflow-y-scroll h-[80vh] flex flex-col pl-4 pr-4' ref={messagesContainerRef}>
              {messages.map((messageElement) => {
                switch (messageElement.file_type) {
                  //Text message
                  case null:
                  case undefined:
                    return (
                      <div className={'bg-blue-100 w-2/3 rounded-xl p-4 h-auto whitespace-normal flex flex-col flex-wrap' + (messageElement.sender == username ? ' ml-auto mr-4 bg-green-100' : '')}>
                        {selectedConversation.current.type == 'group' && messageElement.sender != username && <div className='font-bold'>{messageElement.sender}</div>}
                        <span className='break-words max-w-full'>{messageElement.text}</span>
                        <div className=''>Sent at : {formatUTCDate(messageElement.time_sent)}</div>
                      </div>
                    )
                  //Image sent
                  case 'image/jpeg':
                  case 'image/png':
                    return (
                      <div className={'bg-blue-100 w-2/3 rounded-xl p-4 h-auto whitespace-normal flex flex-col flex-wrap  cursor-pointer' + (messageElement.sender == username ? ' ml-auto mr-4 bg-green-100' : '')}
                        onClick={() => handleOpenImageModal(DOWNLOAD_BASE_URL + `/${messageElement.file_path}`)}
                      >
                        {selectedConversation.current.type == 'group' && messageElement.sender != username && <div className='font-bold'>{messageElement.sender}</div>}
                        <img className='bg-green-400 rounded-lg col-span-1 w-3/4' src={DOWNLOAD_BASE_URL + `/${messageElement.file_path}`} id={"img-" + messageElement.file_path} />
                        <div className=''>Sent at : {formatUTCDate(messageElement.time_sent)}</div>
                      </div>
                    )
                  //Document / other
                  default:
                    const fileDisplayType = getFileDisplayType(messageElement.file_type)
                    return (
                      <div className={'bg-blue-100 w-2/3 rounded-xl p-4 h-auto whitespace-normal flex flex-col flex-wrap cursor-pointer' + (messageElement.sender == username ? ' ml-auto mr-4 bg-green-100' : '')}
                        onClick={() => { handleDownload(DOWNLOAD_BASE_URL + `/${messageElement.file_path}`, messageElement.original_name) }}
                      >
                        {selectedConversation.current.type == 'group' && messageElement.sender != username && <div className='font-bold'>{messageElement.sender}</div>}
                        <span className='break-words max-w-full'>Click to download</span>
                        <span className='break-words max-w-full underline'>{messageElement.original_name}</span>
                        <div className=''>Sent at : {formatUTCDate(messageElement.time_sent)}</div>
                      </div>
                    )
                }


              })
              }
              <div className='absolute bottom-0 grid grid-cols-7 lg:w-3/5 ml-auto w-11/12'>
                <img onClick={openAttachmentsModal} className='bg-green-200 p-4 m-4 col-span-1 rounded-lg inline cursor-pointer' src='./clip.png' />
                <input
                  ref={messageInputRef}
                  placeholder='Your message here'
                  value={messageInputText}
                  onChange={(e) => setMessageInputText(e.target.value)}
                  className='bg-gray-100 p-4 m-4 col-span-5 rounded-lg'
                />

                <button onClick={handleSendingMessage} ref={sendButtonRef} className='bg-green-200 p-4 m-4 col-span-1 rounded-lg'>Send</button>

              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}