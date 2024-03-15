import { db } from '../dbconfig.js'
import { Sequelize } from 'sequelize';
import User from './User.js';

const InteractionLog = db.define('InteractionLog', {
  conversation_with: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey:true,
  },
  participant: {
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey:true,
  }, 
  last_checked: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
})

User.belongsToMany(User,{through:"InteractionLog", as: "conversation_with", foreignKey:"username"})
User.belongsToMany(User,{through:"InteractionLog", as: "participant", foreignKey:"username"})

export default InteractionLog