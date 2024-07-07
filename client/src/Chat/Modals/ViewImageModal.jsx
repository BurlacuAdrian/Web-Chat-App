import { formatUTCDate } from '../HelperFunctions.js'
import { MENU_STYLE, MOBILE_MENU_STYLE } from '../Syles.js'
import { useEffect, useState } from 'react'
import axiosInstance from '../../Auth/axiosConfig'

export default function ViewImageModal({ closeModal, imageSource, mobileVersion }) {
  const DOWNLOAD_BASE_URL = 'http://localhost:8080/api/v1/download'

  const handleDownload = (original_name) => {
    fetch(imageSource)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        //TODO update download name
        link.setAttribute('download', "Webchat-picture" + formatUTCDate(new Date()) + '.png');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch(error => console.error('Download failed:', error));
  };


  return (
    <div className={'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-3/5 bg-blue-100 rounded-xl flex flex-col' + MENU_STYLE + (mobileVersion ? MOBILE_MENU_STYLE : '')}>
      <img className='bg-green-400 rounded-lg col-span-1 w-2/3 ml-auto mr-auto mt-4' src={imageSource} />
      <div className='flex ml-auto mr-auto mt-4 gap-8'>
        <button onClick={handleDownload} className='button-main w-40'>Download</button>
        <button onClick={closeModal} className='button-main w-40'>Close</button>
      </div>

    </div>
  )
}