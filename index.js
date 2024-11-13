require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')




//fonction de connexion à la base de donnée
const dbConnect = async()=>{
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('connexion to database success')
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}
//appel de la fontion de connexion à la base de donné
dbConnect();

//user model
const userSchema = new mongoose.Schema({
  username:{
    type:String,
    require:true
  }
})

let User = mongoose.model('User',userSchema)

app.use(cors())
app.use(express.static('public'))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json())
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use((req,res,next)=>{
  console.log(
    `${req.method} ${req.path} - ${req.ip}`
  )
  next()
})

//create user
app.post('/api/users', async (req, res) => {
  const userName = req.body.username; // S'assure que req.body est bien parsé
  try {
    const existingUser = await User.findOne({ username: userName });
    if (existingUser) {
      return res.json({ message: 'User already exists' });
    }

    const newUser = await User.create({ username: userName });
    if (newUser) {
      res.status(200).json({
        _id: newUser._id,
        username: newUser.username,
      });
    }
  } catch (error) {
    res.json({ error: 'Server error' });
  }
});

//get all users
app.get('/api/users', async(req,res)=>{
  try {
    const users = await User.find({}, '_id username');
    res.status(200).json(users)
  } catch (error) {
    res.json({ error: 'Server error' });
  }
})






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
