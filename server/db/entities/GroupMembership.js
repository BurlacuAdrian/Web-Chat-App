import { db } from '../dbconfig.js'
import { Sequelize } from 'sequelize';

const GroupMembership = db.define('GroupMembership', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true
  },
  group_id: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: false,
  },
  participant: {
    type: Sequelize.STRING,
    allowNull: true,
  }, 
  last_checked: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  joined_at: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  }
})


export default GroupMembership