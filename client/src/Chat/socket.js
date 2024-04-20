import { io } from 'socket.io-client';

const URL = 'http://localhost:3080';

let cookieValue = null

try {
  cookieValue = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];
  // console.log('Secure cookie value:', cookieValue);
} catch (error) {
  
}


export const socket = io(URL, {
  autoConnect: false,
  extraHeaders: {
    Authorization: `Bearer ${cookieValue}`
  }
});