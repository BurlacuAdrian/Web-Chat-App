import { db } from '../dbconfig.js'
import { Sequelize } from 'sequelize';

const User = db.define('User', {
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true
  },
  display_name: {
    type: Sequelize.STRING,
    allowNull: true
  }, 
  password_hash: {
    type: Sequelize.STRING,
    allowNull: false
  },
})


export default User