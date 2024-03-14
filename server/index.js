import express from 'express'
import env from 'dotenv'
import apiRouter from './routes/api.js'

env.config()

const app = express()

app.use('/api/v1/',apiRouter)

const PORT = process.env.SERVER_PORT | 8080
app.listen(PORT,()=>{
  console.log("Server is running on port "+PORT)
})