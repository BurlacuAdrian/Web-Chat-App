import mysql from 'mysql2/promise';
import env from 'dotenv'
import { Sequelize } from 'sequelize';

env.config('../')

const DB_PORT = process.env.DB_PORT
const DB_NAME = process.env.DB_NAME
const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD

export async function createDataBaseConnection() {
  let conn;
  mysql.createConnection({
    port: DB_PORT,
    user: DB_USERNAME,
    password: DB_PASSWORD,
  })
    .then((connection) => {
      conn = connection
      return connection.query('CREATE DATABASE IF NOT EXISTS '+DB_NAME)
    })
    .then(() => {
      return conn.end()
    })
    .catch((err) => {
      console.warn(err.stack)
    })
}

export const db = new Sequelize({
  port:DB_PORT,
  dialect: 'mysql',
  database: DB_NAME,
  username: DB_USERNAME,
  password: DB_PASSWORD,  
  logging: false,
  define: {
  timestamps: false,
  freezeTableName: true
  }  
})

