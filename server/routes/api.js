import express from 'express'
import bcrypt from 'bcrypt'
import env from 'dotenv'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { Sequelize, Op, where } from 'sequelize'
import { verifyJWTMiddleware } from './middlewares.js'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { loginSchema, signupSchema } from './joiSchemas.js'

// Database entities
import { db, createDataBaseConnection } from '../db/dbconfig.js'
import User from '../db/entities/User.js'
import InteractionLog from '../db/entities/InteractionLog.js'
import Message from '../db/entities/Message.js'
import Group from '../db/entities/Group.js'
import GroupMembership from '../db/entities/GroupMembership.js'
import Attachment from '../db/entities/Attachment.js'

import ONLINE_USERS from '../socketio/TwoWayMap.js'

await createDataBaseConnection()
// await db.sync({force:true})
await db.sync({ force: false })

env.config('../')
const JWT_SECRET = process.env.JWT_SECRET

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const apiRouter = express.Router()
apiRouter.use(express.json())
apiRouter.use(cookieParser())
apiRouter.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
export default apiRouter
const API = apiRouter

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PROFILE_PICTURE_PATH = path.join(__dirname, '..', 'public', 'images', 'default_profile_picture.png')
const DEFAULT_PROFILE_PICTURE = fs.readFileSync(DEFAULT_PROFILE_PICTURE_PATH);

API.get('/hello', (req, res) => {
  res.status(200).json('hello!')
})

API.get('/protected', verifyJWTMiddleware, (req, res) => {
  res.status(200).json(req.verified)
})

API.post('/signup', async (req, res) => {
  // Validate the input
  const { error, value } = signupSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  let { username, display_name, password } = value;

  if (!display_name || display_name.trim() === '') {
    display_name = username;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    await User.create({ username, display_name, password_hash });

    jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' }, (err, token) => {
      if (err) {
        console.error('Error signing JWT token:', err);
        return res.status(500).json({ error: 'Error signing JWT token' });
      }

      res.cookie('token', token, { sameSite: 'none', secure: true }).status(200).json({ username });
    });

  } catch (error) {
    res.status(500).json({ error: 'Error during signup' });
    console.log('Error during signup', error);
  }
});

API.post('/login', async (req, res) => {
  // Validate the input
  const { error, value } = loginSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { username, password } = value;

  try {
    const queriedUser = await User.findByPk(username);
    if (!queriedUser) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const correctPassword = await bcrypt.compare(password, queriedUser.password_hash);
    if (!correctPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' }, (err, token) => {
      if (err) {
        console.error('Error signing JWT token:', err);
        return res.status(500).json({ error: 'Error signing JWT token' });
      }

      const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
      res.cookie('token', token, { expires: expirationDate, sameSite: 'none', secure: true }).status(200).json({ username });
    });

  } catch (error) {
    res.status(500).json({ error: 'Error during login' });
    console.log('Error during login', error);
  }
});

//TODO remove, debug only
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

//TODO remove, debug only
API.get('/online-users', verifyJWTMiddleware, async (req, res) => {
  const username = req.verified.username

  try {
    const users = await User.findAll({
      attributes: ['username', 'display_name']
    })
    const payload = users.map(userElement => {

      return {
        username: userElement.username,
        display_name: userElement.display_name,
        online: ONLINE_USERS.online(userElement.username)
      }
    })
    res.status(200).json(payload)
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
    //For the friend that has yet to interact with us
    await InteractionLog.findOrCreate({
      where: {
        conversation_with: username,
        participant: conversation_with
      },
      defaults: {
        conversation_with: username,
        participant: conversation_with,
        last_checked: currentTimestamp
      }

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
    const [users, usersMeta] = await db.query({
      query: `
      SELECT 
  u.display_name, 
  u.username, 
  (
    SELECT 
      COUNT(*) 
    FROM 
      message m 
    WHERE 
      m.receiver = ?
      AND m.sender = u.username
      AND m.time_sent > COALESCE(
        (
          SELECT 
            il.last_checked 
          FROM 
            interactionlog il 
          WHERE 
            il.conversation_with = u.username 
            AND il.participant = ?
          ORDER BY
            il.last_checked DESC
          LIMIT 1
        ),
        '1970-01-01'
      )
  ) AS unread, 
  (
    SELECT 
      m2.\`text\` 
    FROM 
      message m2 
    WHERE 
      (
        m2.sender = u.username 
        AND m2.receiver = ?
      ) 
      OR (
        m2.sender = ? 
        AND m2.receiver = u.username
      ) 
    ORDER BY 
      m2.time_sent DESC 
    LIMIT 
      1
  ) AS last_message 
FROM user u 
WHERE 
  u.username IN (
    SELECT 
      il.conversation_with AS username 
    FROM 
      interactionlog il 
    WHERE 
      il.participant = ? 
    UNION 
    SELECT 
      il2.participant AS username 
    FROM 
      interactionlog il2 
    WHERE 
      il2.conversation_with = ?
  ) 
GROUP BY 
  u.display_name, 
  u.username;
    
  `, values: [username, username, username, username, username, username]
    })

    const usersPayload = users.map(userElement => {
      return {
        id: userElement.username,
        type: "user",
        display_name: userElement.display_name,
        last_message: userElement.last_message,
        unread: userElement.unread,
        online: ONLINE_USERS.online(userElement.username)
      }
    })

    const [groups, groupsMeta] = await db.query({
      query:
        `
        SELECT 
  g.group_name, 
  g.group_id, 
  COUNT(m.id) AS unread, 
  (
    SELECT 
      \`text\` 
    FROM 
      message 
    WHERE 
      receiver = g.group_id
    ORDER BY 
      time_sent DESC 
    LIMIT 
      1
  ) AS last_message 
FROM 
  \`group\` g 
  LEFT JOIN groupmembership gm ON g.group_id = gm.group_id AND gm.participant = ?
  LEFT JOIN message m ON m.receiver = g.group_id 
    AND m.time_sent > COALESCE(gm.last_checked, '1970-01-01')
WHERE 
  g.group_id IN (
    SELECT 
      group_id 
    FROM 
      groupmembership gm 
    WHERE 
      gm.participant = ?
  ) 
GROUP BY 
  g.group_name, 
  g.group_id;

      `, values: [username, username]
    })

    const groupsPayload = groups.map(groupElement => {
      return {
        id: groupElement.group_id,
        type: "group",
        display_name: groupElement.group_name,
        last_message: groupElement.last_message,
        unread: groupElement.unread,
      }
    })

    const payload = usersPayload.concat(groupsPayload)

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    console.log('Error at get/conversations', error);
  }
});

API.get('/messages/:type/:with', verifyJWTMiddleware, async (req, res) => {
  const username = req.verified.username
  const { with: conversation_with, type } = req.params

  console.log(conversation_with)
  if (conversation_with == null)
    res.status(400).send("Provide a username or group id")
  try {

    if (type == 'user') {
      const messages = await db.query({
        query: `
        SELECT m.id, m.sender, m.receiver, m.text, m.time_sent, a.file_type, a.file_path, a.original_name
        FROM Message m
        LEFT JOIN Attachment a
        ON m.id = a.attachment_id
        WHERE (
        (m.sender = ? AND m.receiver = ?) 
        OR 
        (m.sender = ? AND m.receiver = ?) );
        `, values: [username, conversation_with, conversation_with, username]
      });
      res.status(200).json(messages[0])
      return
    }

    const messages = await db.query({
      query: `
      SELECT m.id, m.sender, m.receiver, m.text, m.time_sent, a.file_type, a.file_path, a.original_name
      FROM Message m
      LEFT JOIN Attachment a
      ON m.id = a.attachment_id
      WHERE (m.receiver = ?);
      `, values: [conversation_with]
    });
    res.status(200).json(messages[0])


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

API.delete('/group/:group_id', verifyJWTMiddleware, async (req, res) => {
  const username = req.verified.username
  const group_id = req.params.group_id
  console.log(`${group_id} left for ${username}`)
  try {
    await GroupMembership.destroy({
      where: {
        group_id,
        participant: username
      }
    })
    res.status(200).json("Left group successfully")
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
    console.log('Error leaving group', error)
  }
})

API.put('/group/:group_id', verifyJWTMiddleware, async (req, res) => {
  const username = req.verified.username
  const group_id = req.params.group_id
  const currentTimestamp = new Date();
  try {
    await GroupMembership.update({
      last_checked: currentTimestamp
    }, {
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

API.put('/profile_picture', verifyJWTMiddleware, upload.single('profile_picture'), async (req, res) => {
  try {

    const username = req.verified.username

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const file = req.file
    const imageData = file.buffer;

    const resizedImageData = await sharp(imageData)
      .resize({ width: 400, height: 400, fit: 'cover' })
      .toBuffer();

    await User.update({ profile_picture: resizedImageData }, {
      where: {
        username
      }
    })

    res.status(201).json("Success")
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
});

API.get('/profile_picture/:username', async (req, res) => {
  try {
    const username = req.params.username;

    var user = await User.findOne({ where: { username } });
    res.setHeader('Content-Type', 'image/jpeg');

    if (!user || user?.profile_picture == null) {
      return res.status(200).send(DEFAULT_PROFILE_PICTURE);
    }

    return res.status(200).send(user.profile_picture);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

API.delete('/profile_picture', verifyJWTMiddleware, async (req, res) => {
  try {
    const username = req.verified.username

    await User.update({ profile_picture: null }, { where: { username } });

    res.status(200).json("Success");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

API.put('/group_picture/:group_id', verifyJWTMiddleware, upload.single('group_picture'), async (req, res) => {
  try {
    //TODO check if user is part of the group
    const username = req.verified.username
    const group_id = req.params.group_id

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    const file = req.file
    const imageData = file.buffer

    const resizedImageData = await sharp(imageData)
      .resize({ width: 400, height: 400, fit: 'cover' })
      .toBuffer();

    await Group.update({ group_picture: resizedImageData }, {
      where: {
        group_id
      }
    })

    res.status(201).json("Success")
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
});

API.get('/group_picture/:group_id', async (req, res) => {
  try {
    const group_id = req.params.group_id;

    const group = await Group.findOne({ where: { group_id } });

    if (!group || group?.group_picture == null) {
      return res.status(404).send(null)
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.status(200).send(group.group_picture);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

API.get('/group_members/:group_id', async (req, res) => {
  try {
    const group_id = req.params.group_id;

    const [members, mebersMeta] = await db.query({
      query: `
    SELECT username, display_name, gm.joined_at
    FROM User u
    INNER JOIN GroupMembership gm ON gm.participant = u.username
    WHERE group_id = ?
    `, values: [group_id]
    })

    res.status(200).json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

API.put('/display_name', verifyJWTMiddleware, async (req, res) => {
  try {

    const username = req.verified.username
    const display_name = req.body.display_name

    await User.update({ display_name }, {
      where: {
        username
      }
    })

    res.status(201).json("Success")
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
});

API.get('/display_name/:username', verifyJWTMiddleware, async (req, res) => {
  try {

    const username = req.params.username

    const user = await User.findByPk(username)
    const display_name = user.display_name

    res.status(201).json(display_name)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
});

API.get('/picture/:attachment_uuid', verifyJWTMiddleware, async (req, res) => {
  try {
    const attachment_uuid = req.params.attachment_uuid

    const attachment = await Attachment.findByPk(attachment_uuid);
    const ATTACHMENTS_PATH = path.join(__dirname, '..', 'public', 'attachments')

    switch (attachment.file_type) {
      case 'img':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case 'txt':
        res.setHeader('Content-Type', 'text/plain');
        break;
      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf');
        break;
      default:
      // code block
    }

    var user = await User.findOne({ where: { username } });
    res.setHeader('Content-Type', 'image/jpeg');

    if (!user || user?.profile_picture == null) {
      return res.status(200).send(DEFAULT_PROFILE_PICTURE);
    }

    return res.status(200).send(user.profile_picture);

    // fs.readFile(ATTACHMENTS_PATH + `/${attachment_uuid}`, (err, data) => {
    //   return res.status(200).send(data);
    // })



    // return res.status(200).send(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

API.get('/download/:attachment_uuid', verifyJWTMiddleware, async (req, res) => {
  try {
    const attachment_uuid = req.params.attachment_uuid

    const ATTACHMENTS_PATH = path.join(__dirname, '..', 'public', 'attachments')

    return res.status(200).sendFile((ATTACHMENTS_PATH + `/${attachment_uuid}`));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


API.post('/logout', async (req, res) => {
  try {
    return res.clearCookie('token').status(200).json('OK')
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

API.get('/status/:user', verifyJWTMiddleware,async (req, res) => {
  const { user } = req.params
  try {
    res.status(200).json(ONLINE_USERS.online(user))
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})



