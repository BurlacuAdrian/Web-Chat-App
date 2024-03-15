import { createServer } from 'http'
const server = createServer()
import { Server } from 'socket.io'
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173"
  }
})
import {storeMessage} from '../routes/storeMessage.js'

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

io.on('connection', socket => {
  console.log(socket.id + " has connected")

  socket.on('disconnect', reason => {
    console.log(socket.id + " has disconnected")
  })

  socket.on('join-room', roomObject => {
    const { room_id, conversationType } = roomObject
    socket.join(room_id)
    console.log(`${socket.id} joined ${room_id}`)
  })

  socket.on("send-mesage", async (messageObj) => {
    const { sender, receiver, text } = messageObj
    const room_id = getConversationRoomId(sender,receiver)
    io.to(room_id).emit('receive-message', {
      sender,
      receiver,
      room_id,
      text,
      time_sent: getCurrentTimeString()
    })
    // console.log(`${sender} sent a message to ${receiver} containing ${text}`)

    const result = await storeMessage({sender, receiver, text})
    console.log(`Message from ${sender} to ${receiver}`+ (result==true ? "sent" : "failed"))

  })

  socket.on("send-message2", () => {
    console.log("here2 from")

  })
})

export default server