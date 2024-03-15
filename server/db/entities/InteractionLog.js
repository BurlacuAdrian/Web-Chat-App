import { db } from '../dbconfig.js'
import { Sequelize } from 'sequelize';

const InteractionLog = db.define('InteractionLog', {
  conversation_with: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey:true,
  },
  participant: {
    type: Sequelize.STRING,
    allowNull: true,
    primaryKey:true,
  }, 
  last_checked: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
})


export default InteractionLog