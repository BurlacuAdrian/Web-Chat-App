import { useCallback, useState } from "react"
import axiosInstance from '../../Auth/axiosConfig'
import { MENU_STYLE, MOBILE_MENU_STYLE } from '../Syles.js'
// import Dropzone from 'react-dropzone';
import { useDropzone } from 'react-dropzone';


export default function AttachmentsModal({ closeModal, mobileVersion, socketRef, selectedConversation, username, setMessages, setConversations }) {


  const onDrop = useCallback(acceptedFiles => {
    // Handle the files
    console.log(acceptedFiles);
    // Call a function to send files to the API
    uploadFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

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

  /*** API ***/

  const uploadFiles = async (files) => {

    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    console.log(files[0].type)

    var sentAttachment = null

    socketRef.current.emit("send-attachment", {
      sender: username,
      receiver: selectedConversation.current.id,
      type: selectedConversation.current.type,
      file: files[0],
      text: files[0].name,
      file_type: files[0].type,
      original_name: files[0].name
    }, (response) => {
      sentAttachment = response
      console.log(sentAttachment)

      // if (selectedConversation.current.type == 'user') {

      console.log('added from here')

      if (selectedConversation.current.type == 'user') {
        setMessages(oldMessages => {
          const newMessages = [...oldMessages]
          newMessages.push(sentAttachment)
          return newMessages
        })

      }

      setConversations(oldValue => {

        const newValue = [...oldValue]

        return newValue.map(conversation => {
          if (conversation.id === selectedConversation.current.id) {
            //TODO change to look better
            return { ...conversation, last_message: files[0].name };
          }

          return conversation;
        });
      });
      // messageInputRef.current.focus();
      closeModal()

    })



  }


  return (
    <div className={'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-3/5 bg-blue-100 rounded-xl flex flex-col items-center p-4 pt-8 pb-8 justify-around' + MENU_STYLE + (mobileVersion ? MOBILE_MENU_STYLE : '')}>
      <div {...getRootProps()} className="bg-cyan-100 w-full h-4/5 rounded-xl flex items-center justify-center">
        <input {...getInputProps()} />
        <span className="text-xl w-fit">Drag 'n' drop some files here, or click to select files</span>
      </div>
      <button onClick={closeModal} className='button-main'>Cancel</button>

    </div>
  )
}