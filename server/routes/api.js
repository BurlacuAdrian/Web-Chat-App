import express from 'express'
import bcrypt from 'bcrypt'
import env from 'dotenv'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { Sequelize, Op } from 'sequelize'
import { verifyJWTMiddleware } from './middlewares.js'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid';

// Database entities
import { db, createDataBaseConnection } from '../db/dbconfig.js'
import User from '../db/entities/User.js'
import InteractionLog from '../db/entities/InteractionLog.js'
import Message from '../db/entities/Message.js'
import Group from '../db/entities/Group.js'
import GroupMembership from '../db/entities/GroupMembership.js'


await createDataBaseConnection()
// await db.sync({force:true})
await db.sync({ force: false })

env.config('../')
const JWT_SECRET = process.env.JWT_SECRET

const apiRouter = express.Router()
apiRouter.use(express.json())
apiRouter.use(cookieParser())
apiRouter.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
export default apiRouter
const API = apiRouter

API.get('/hello', (req, res) => {
  res.status(200).json('hello!')
})

API.get('/protected', verifyJWTMiddleware, (req, res) => {
  res.status(200).json(req.verified)
})

API.post('/signup', async (req, res) => {
  const { username, display_name, password } = req.body

  if (display_name == null)
    display_name = username

  try {
    const salt = await bcrypt.genSalt(10)
    const password_hash = await bcrypt.hash(password, salt)
    let id = await User.create({ username, display_name, password_hash })

    jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) {
        console.error('Error signing JWT token:', err);
        return res.status(500).json({ error: 'Error signing JWT token' });
      }

      res.cookie(('token', token, { sameSite: 'none', secure: true })).status(200).json({ username, user_id: id })
    })

  } catch (error) {
    res.status(500).json('Error during signup')
    console.log('Error during signup', error)
  }
})

API.post('/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const queriedUser = await User.findByPk(username)
    if (!queriedUser) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const correctPassword = await bcrypt.compare(password, queriedUser.password_hash)
    if (!correctPassword) {
      res.status(401).json('Invalid username or password.')
    }

    jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) {
        console.error('Error signing JWT token:', err);
        return res.status(500).json({ error: 'Error signing JWT token' });
      }

      res.cookie('token', token, { sameSite: 'none', secure: true }).status(200).json({ username })
    })

  } catch (error) {
    res.status(500).json('Error during login')
    console.log('Error during login', error)
  }
})

API.get('/users', verifyJWTMiddleware, async (req, res) => {
  const username = req.verified.username

  try {
    const users = await User.findAll({
      where: {
        username: {
          [Sequelize.Op.ne]: username // [Op.ne] represents 'not equal'
        }
      },
      attributes: ['username', 'display_name']
    })
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
    console.log('Error at get/users', error)
  }

})

API.put('/interaction/:with', verifyJWTMiddleware, async (req, res) => {
  const username = req.verified.username
  const conversation_with = req.params.with
  const currentTimestamp = new Date();
  try {
    await InteractionLog.upsert({
      conversation_with,
      participant: username,
      last_checked: currentTimestamp
    })
    res.status(200).send("Success")
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
    console.log('Error at put/interaction', error)
  }
})

API.get('/conversations', verifyJWTMiddleware, async (req, res) => {
  const username = req.verified.username;

  try {
    const userAsParticipantArray = await InteractionLog.findAll({
      where: {
        participant: username
      },
      attributes: ['conversation_with']
    });


    const userAsReceiverArray = await InteractionLog.findAll({
      where: {
        conversation_with: username
      },
      attributes: ['participant']
    });

    // Extract conversation_with values
    const userAsParticipantValues = userAsParticipantArray.map(conversation => conversation.conversation_with);
    const userAsReceiverValues = userAsReceiverArray.map(conversation => conversation.participant);

    // console.log(userAsParticipantValues)
    // console.log(userAsReceiverValues)

    //Concatenate
    const userValuesPossibleDuplicates = userAsParticipantValues.concat(userAsReceiverValues)

    //Remove duplicates
    const userValues = Array.from(new Set(userValuesPossibleDuplicates))

    // console.log(userValues)

    const usersPayload = userValues.map(usernameElement => {
      return {
        id: usernameElement,
        type: "user",
        display_name: usernameElement, //TODO
        last_message: 'last message', //TODO
        unread: 7, //TODO
      }
    })

    //TODO search in group membership also

    const groups = await GroupMembership.findAll({where:{
      participant : username
    }})

    const groupsPayload = groups.map(groupElement => {
      return {
        id: groupElement.group_id,
        type: "group",
        display_name: groupElement.group_id,//TODO
        last_message: 'last message', //TODO
        unread: 7, //TODO
      }
    })

    console.log(JSON.parse(JSON.stringify(groups)))

    const payload = usersPayload.concat(groupsPayload)

    //TODO get last message and number of unread messages for each conversation

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    console.log('Error at get/conversations', error);
  }
});

API.get('/messages/:with', verifyJWTMiddleware, async (req, res) => {
  const username = req.verified.username
  const conversation_with = req.params.with
  if (conversation_with == null)
    res.status(400).send("Provide a username or group id")
  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          {
            sender: username,
            receiver: conversation_with
          },
          {
            sender: conversation_with,
            receiver: username
          }
        ]
      }
    });
    res.status(200).json(messages)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
    console.log('Error at put/interaction', error)
  }
})

API.post('/group', verifyJWTMiddleware, async (req, res) => {
  const username = req.verified.username
  const group_name = req.body.group_name
  const group_id = uuidv4()
  const currentTimestamp = new Date();
  try {
    const result = await Group.create({
      group_id, group_name
    })

    await GroupMembership.create({
      group_id,
      participant: username,
      last_checked: currentTimestamp,
      joined_at: currentTimestamp,
    })
    res.status(200).json({ message: "Success", group_id })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
    console.log('Error at post/group', error)
  }
})

API.post('/group/:group_id/:friend', verifyJWTMiddleware, async (req, res) => {
  //TODO check if user is part of said group
  const username = req.verified.username
  const group_id = req.params.group_id
  const friend = req.params.friend
  const currentTimestamp = new Date();
  try {
    await GroupMembership.create({
      group_id,
      participant: friend,
      last_checked: currentTimestamp,
      joined_at: currentTimestamp,
    })
    res.status(200).json("Success")
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
    console.log('Error at post/group/group_id/friend', error)
  }
})

API.delete('/group/:group_id/:friend', verifyJWTMiddleware, async (req, res) => {
  //TODO check if user is part of said group
  const username = req.verified.username
  const group_id = req.params.group_id
  const friend = req.params.friend
  try {
    await GroupMembership.destroy({
      where: {
        group_id,
        participant: friend
      }
    })
    res.status(200).json("Success")
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
    console.log('Error at put/group/group_id/friend', error)
  }
})

API.put('/group/:group_id', verifyJWTMiddleware, async (req, res) => {
  const username = req.verified.username
  const group_id = req.params.group_id
  const currentTimestamp = new Date();
  try {
    await GroupMembership.update({
      last_checked: currentTimestamp
    },{
      where: {
        group_id,
        participant: username,
      }
    })
    res.status(200).send("Success")
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
    console.log('Error at put/group', error)
  }
})










