import { MENU_STYLE, MOBILE_MENU_STYLE } from './Syles.js'
import { useEffect, useRef, useState } from 'react'
import axiosInstance from '../Auth/axiosConfig'
import { formatUTCDate } from './HelperFunctions'

const USER_PFP_BASE_URL = 'http://localhost:8080/api/v1/profile_picture'
const GROUP_PIC_BASE_URL = 'http://localhost:8080/api/v1/group_picture'
const hoverTransitionClassName = ' transition-transform duration-200 hover:-translate-y-1 hover:cursor-pointer'

export default function ContactsContainer({openConversation, conversations}) {

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

  const formatLastMessage = ( conversationElement) => {
    // console.log(conversationElement)
    if(conversationElement.file_type!=null){
      return getFileDisplayType(conversationElement.file_type)
    }

    if(conversationElement.last_message?.length > 10){
      return `${conversationElement.last_message.substring(0, 10)}...`
    }

    return conversationElement.last_message

  }

  return (
    <div id='contacts-container' className='grid gap-2 mt-4'>
      {conversations.map((conversationElement) => {
        return (
          <div key={conversationElement.id}>
            <div className={'grid grid-cols-4 pl-2' + hoverTransitionClassName} onClick={() => openConversation(conversationElement.id, conversationElement.type, conversationElement.display_name)}>
              <img className='bg-green-400 rounded-lg col-span-1 size-16' src={(conversationElement.type == 'user' ? USER_PFP_BASE_URL : GROUP_PIC_BASE_URL) + `/${conversationElement.id}`} id={"img-" + conversationElement.id} />
              <div className='ml-4 pl-4 pt-4 pb-4 col-span-2 grid grid-rows-2 bg-blue-100 rounded-lg '>
                <div>
                  <span className='font-bold'>{conversationElement.display_name} </span>
                  <span>{(conversationElement.hasOwnProperty('online') ? (conversationElement.online ? 'online' : 'offline') : '')}</span>
                </div>

                <span className=''>
                  { formatLastMessage(conversationElement)
                  }
                </span>
                
              </div>
              {conversationElement.unread > 0 &&
                <div className='col-span-1 flex items-center text-center'>{`${conversationElement.unread} unread message` + (conversationElement.unread == 1 ? '' : 's')}</div>}

            </div>
          </div>
        )
      })}
    </div>
  )
}