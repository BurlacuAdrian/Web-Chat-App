import { io } from 'socket.io-client';

const URL = 'http://localhost:3080';

let cookieValue = null;

const getTokenFromCookies = () => {
  const token = document.cookie.split('; ').find(row => row.startsWith('token='));
  return token ? token.split('=')[1] : null;
};

const resetToken = () => {
  try {
    socket.io.opts.extraHeaders.Authorization = `Bearer ${getTokenFromCookies()}`;
  } catch (error) {
    console.error("Error resetting token:", error);
  }
};

try {
  cookieValue = getTokenFromCookies();
  // console.log('Secure cookie value:', cookieValue);
} catch (error) {
  console.log("Error getting token");
}

export const socket = io(URL, {
  autoConnect: false,
  extraHeaders: {
    Authorization: `Bearer ${cookieValue}`
  }
});

export { resetToken };