import { db } from '../dbconfig.js'
import { Sequelize } from 'sequelize';

const Message = db.define('Message', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true
  },
  sender: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  receiver: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  text: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  time_sent: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
})

export default Message