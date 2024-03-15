import { db } from '../dbconfig.js'
import { Sequelize } from 'sequelize';
import User from './User.js';
import Group from './Group.js';

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
    allowNull: false,
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

User.belongsToMany(Group,{through:"GroupMembership",foreignKey:"participant"})
Group.belongsToMany(User,{through:"GroupMembership",foreignKey:"group_id"})

export default GroupMembership