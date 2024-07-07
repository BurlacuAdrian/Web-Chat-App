import Message from "../db/entities/Message.js"
import Attachment from '../db/entities/Attachment.js'
import { v4 as uuidv4 } from 'uuid'
import {promises as fs} from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from "sharp"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ATTACHMENTS_PATH = path.join(__dirname, '..', 'public', 'attachments')

export const storeMessage = async (messageObject) => {
  try {
    await Message.create(messageObject)
    return true
  } catch (error) {
    console.log("Error while storing message ",error)
    return false
  }
}

export const storeAttachment = async (messageObject, file, file_type, original_name) => {
  try {
    // messageObject.text=""
    // console.log(messageObj)
    const message = await Message.create(messageObject)

    const fileType = file.file_type
    const fileUuid = uuidv4()
    const file_path = fileUuid
    
    const attachment = await Attachment.create({
      attachment_id: message.id,
      file_type: file_type,
      file_path,
      original_name
    })

    await fs.writeFile(ATTACHMENTS_PATH+`/${file_path}`, file)
    return file_path
  } catch (error) {
    console.log("Error while storing message ",error)
    return false
  }
}