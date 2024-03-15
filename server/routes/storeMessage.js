import Message from "../db/entities/Message.js"
export const storeMessage = async (messageObject) => {
  try {
    await Message.create(messageObject)
    return true
  } catch (error) {
    console.log("Error while storing message ",error)
    return false
  }
}