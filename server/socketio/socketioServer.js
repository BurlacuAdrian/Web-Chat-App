import { createServer } from 'http'
const server = createServer()
import { Server } from 'socket.io'
import { db, createDataBaseConnection } from '../db/dbconfig.js'
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173"
  }
})
import {storeMessage} from '../routes/storeMessage.js'
import ONLINE_USERS from './TwoWayMap.js'
import { verifyJWT } from '../routes/middlewares.js'
import { query } from 'express'

//TODO debug only
let previousState = {};

function logMapContents(twoWayMap) {
    setInterval(() => {
        const currentState = twoWayMap.socketIdToUsernameMap;

        // Compare current state with previous state
        if (!isEqual(currentState, previousState)) {
            console.log('Map contents:');
            for (const key in currentState) {
                console.log(`${key}: ${currentState[key]}`);
            }
            // console.log('---');
        }

        // Update previous state
        previousState = { ...currentState };
    }, 1000);
}

// Utility function to compare objects
function isEqual(obj1, obj2) {
    const obj1Keys = Object.keys(obj1);
    const obj2Keys = Object.keys(obj2);

    if (obj1Keys.length !== obj2Keys.length) {
        return false;
    }

    for (let key of obj1Keys) {
        if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}
logMapContents(ONLINE_USERS);



const getCurrentTimeString = () => {
  const currentDate = new Date();

  // Get the current date components
  const year = currentDate.getFullYear(); // Full year (YYYY)
  const month = currentDate.getMonth() + 1; // Month (0-11, add 1 for January to December)
  const day = currentDate.getDate(); // Day of the month (1-31)
  const hours = currentDate.getHours(); // Hour (0-23)
  const minutes = currentDate.getMinutes(); // Minutes (0-59)
  const seconds = currentDate.getSeconds(); // Seconds (0-59)

  // Format the current date and time as a string
  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  return formattedDateTime
}

const getConversationRoomId = (username1, username2) => {
  const sortedUsernames = [username1, username2].sort();
  const concatenatedUsernames = sortedUsernames.join('-');
  return concatenatedUsernames;
}

const getFriendsUsernameArray = async (friendsOf) => {

  var friendsArray = []

  try {
    const [friends, friendsMeta] = await db.query({query:`
      (SELECT 
        participant AS username 
      FROM 
        interactionlog 
      WHERE 
        conversation_with = ?)
      UNION 
      (SELECT 
        conversation_with AS username 
      FROM 
        interactionlog 
      WHERE 
        participant = ?)
    `,values:[friendsOf,friendsOf]})
    const payload = friends.map(friendElement => {
      return friendElement.username
    })
    friendsArray = payload
    console.log(payload)
  } catch (error) {
    console.log(error)
  }
  
  return friendsArray
}

const emitChangeToFriends = async (eventName, eventParams, friendsOf) => {

  const friendsUsernameArray = await getFriendsUsernameArray(friendsOf)
  console.log(friendsUsernameArray)
  const friendsArray = friendsUsernameArray.map(username => ONLINE_USERS.getSocketIdFromUsername(username)) .filter(socketId => socketId !== undefined)

  console.log(friendsArray)
  friendsArray.forEach( socketId => {
    const socket = io.sockets.sockets.get(socketId)
    
    if(socket){
      console.log(`sending to ${socket.id}`)
      socket.emit(eventName, eventParams)
    }
  })
}

io.on('connection', socket => {
  console.log(socket.id + " has connected")

  const headers = socket.handshake.headers
  const authorization = headers.authorization
  const token = authorization.split(' ')[1]

  let username = verifyJWT(token)
  if(username==null){
    socket.disconnect()
    console.log("Kicked "+socket.id)
    return
  }

  ONLINE_USERS.add(socket.id, username)
  emitChangeToFriends('friend-connected',{friend_username: username},username)

  socket.on('disconnect', reason => {
    console.log(socket.id + " has disconnected")
    emitChangeToFriends('friend-disconnected',{friend_username: username},username)
    ONLINE_USERS.delete(socket.id)
  })

  socket.on('join-room', roomObject => {
    const { room_id, conversationType } = roomObject
    socket.join(room_id)
    console.log(`${socket.id} joined ${room_id}`)
  })

  socket.on("send-mesage", async (messageObj) => {
    const { sender, receiver, text, type} = messageObj
    //we assume default is group
    let room_id = receiver
    if(type=="user")
      room_id = getConversationRoomId(sender,receiver)

    //TODO this sends to all connected clients, including the sender
    io.to(room_id).emit('receive-message', {
      sender,
      receiver,
      room_id,
      text,
      type,
      time_sent: getCurrentTimeString()
    })
    // console.log(`${sender} sent a message to ${receiver} containing ${text}`)

    const result = await storeMessage({sender, receiver, text})
    console.log(`${type} Message from ${sender} to ${receiver} `+ (result==true ? "sent" : "failed"))

  })

  socket.on("send-message2", () => {
    console.log("here2 from")

  })
})

export default server