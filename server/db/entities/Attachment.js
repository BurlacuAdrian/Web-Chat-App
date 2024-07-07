import Sequelize from 'sequelize';
import { db } from '../dbconfig.js'
import Message from './Message.js'

const Attachment = db.define("Attachment", {
  attachment_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Message,
      key: 'id'
    }
  },
  file_type: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  file_path: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
    autoIncrement: false,
  },
  original_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  
});


export default Attachment;
