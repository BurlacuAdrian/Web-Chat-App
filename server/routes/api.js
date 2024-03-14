import express from 'express'
import { db, createDataBaseConnection } from '../db/dbconfig.js'
import User from '../db/entities/User.js'
import bcrypt from 'bcrypt'
import env from 'dotenv'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { Sequelize,Op } from 'sequelize'
import {verifyJWTMiddleware} from './middlewares.js'

await createDataBaseConnection()
// await db.sync({force:true})

env.config('../')
const JWT_SECRET = process.env.JWT_SECRET

const apiRouter = express.Router()
apiRouter.use(express.json())
apiRouter.use(cookieParser())
export default apiRouter
const API = apiRouter

API.get('/hello', (req,res)=>{
  res.status(200).json('hello!')
})

API.get('/protected', verifyJWTMiddleware, (req,res)=>{
  res.status(200).json(req.verified)
})

API.post('/signup', async (req,res)=>{
  const {username, display_name, password} = req.body
  
  try {
    const salt = await bcrypt.genSalt(10)
    const password_hash = await bcrypt.hash(password,salt)
    let id = await User.create({username, display_name, password_hash})

    jwt.sign({username}, JWT_SECRET, { expiresIn: '1d' }, (err, token)=>{
      if (err) {
        console.error('Error signing JWT token:', err);
        return res.status(500).json({ error: 'Error signing JWT token' });
      }

      res.cookie(('token', token, {sameSite:'none', secure:true})).status(200).json({username, user_id : id})
    })

  } catch (error) {
    res.status(500).json('Error during signup')
    console.log('Error during signup', error)
  }
})

API.post('/login', async (req,res)=>{
  const {username, password} = req.body
  
  try {
    const queriedUser = await User.findByPk(username)
    if (!queriedUser) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const correctPassword = await bcrypt.compare(password, queriedUser.password_hash)
    if(!correctPassword){
      res.status(401).json('Invalid username or password.')
    }

    jwt.sign({username}, JWT_SECRET, { expiresIn: '1d' }, (err, token)=>{
      if (err) {
        console.error('Error signing JWT token:', err);
        return res.status(500).json({ error: 'Error signing JWT token' });
      }

      res.cookie('token', token, {sameSite:'none', secure:true}).status(200).json({username})
    })

  } catch (error) {
    res.status(500).json('Error during login')
    console.log('Error during login', error)
  }
})




