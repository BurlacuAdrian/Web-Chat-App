import { db } from '../dbconfig.js'
import { Sequelize } from 'sequelize';

const Group = db.define('Group', {
  group_id: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true
  },
  group_name: {
    type: Sequelize.STRING,
    allowNull: false
  }, 
  group_picture: {
    type: Sequelize.BLOB('long'),
    allowNull: true
  },
})


export default Group