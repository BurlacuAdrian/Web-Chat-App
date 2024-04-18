import { useEffect, useState } from 'react'
import {Link,useNavigate} from 'react-router-dom';
import axiosInstance from '../Auth/axiosConfig'

export default function ProfilePage({setLoggedIn}) {
  const navigate = useNavigate();

  const USER_PFP_BASE_URL = 'http://localhost:8080/api/v1/profile_picture'
  const [username, setUsername] = useState(localStorage.getItem('username'))
  const [selectedFile, setSelectedFile] = useState(null)
  const [reloadImage, setReloadImage] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState("")
  const [displayName, setDisplayName] = useState("")

  useEffect( () => {

    async function fetchData(){
      const response = await axiosInstance.get(`/display_name/${username}`)
      console.log(response)
      setDisplayName(response.data)
    }
    fetchData()
  }, [])

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  }

  const handleSubmit = async () => {
    if (!selectedFile) 
      return

    try {
      const formData = new FormData()
      formData.append('profile_picture', selectedFile)

      const response = await axiosInstance.put('/profile_picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.status===201) {
        console.log('Profile picture updated successfully.')
        setSelectedFile(null)
        setReloadImage(prevState => !prevState)
      } else {
        console.error('Failed to update profile picture.')
        
      }
    } catch (error) {
      console.error('Error updating profile picture:', error)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await axiosInstance.delete('/profile_picture')

      if (response.status>=200&response.status<300) {
        console.log('Profile picture deleted successfully.')
        setSelectedFile(null)
        setReloadImage(prevState => !prevState)
      } else {
        console.error('Failed to delete profile picture.')
        
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error)
    }
  }

  const updateDisplayName = async () => {
    if(newDisplayName.length<3)
      return

    try {
      const response = await axiosInstance.put('/display_name', {display_name:newDisplayName})

      if (response.status>=200&response.status<300) {
        console.log('Display name updated successfully.')
      } else {
        console.error('Failed to update Display name.')
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error)
    }
  }

  return (
    <div className="grid grid-cols-2 grid-rows-1 gap-x-12 gap-y-0 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <img className="bg-blue-400" src={`${USER_PFP_BASE_URL}/${username}?${reloadImage ? 'reload=' + Date.now() : ''}`} />
      <div className="grid grid-cols-1 grid-rows-7 gap-x-0 gap-y-6">
        <input type="file" accept="image/*" onChange={handleFileChange}/>
        <button className='bg-blue-200' onClick={handleSubmit}>Update profile picture</button>
        <button className='bg-blue-200' onClick={handleDelete}>Delete profile picture</button>
        <p>Current display name : {displayName}</p>
        <input placeholder='Enter a new display name' value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)}></input>
        <button className='bg-blue-200' onClick={updateDisplayName}>Update display name</button>
        <Link className='bg-blue-200 flex justify-center items-center h-full' to={'/'}>Back to chat</Link>
      </div>
    </div>
  )


}