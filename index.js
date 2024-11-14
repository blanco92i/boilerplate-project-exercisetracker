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
  username: {
    type: String,
    required: true
  },
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]
});

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

//add exercice to user log
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  // Validation des champs description et duration
  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  try {
    // Rechercher l'utilisateur par _id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Créer l'objet de l'exercice
    const exercise = {
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date() // Utilise la date fournie ou la date actuelle
    };

    // Ajouter l'exercice au log de l'utilisateur
    user.log.push(exercise);

    // Sauvegarder l'utilisateur mis à jour
    await user.save();

    // Répondre avec l'objet utilisateur et l'exercice ajouté, formaté comme attendu
    res.status(201).json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(), // Formater la date
      _id: user._id
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

//get user log exercice
app.get('/api/users/:_id/logs', async(req,res)=>{
  const userId =req.params._id
  try {
    const user = await User.findById(userId)
    if(!user){
      res.status(404).json({message:'user dont found'})
    }

    // Formater les dates des exercices dans le log
    const formattedLog = user.log.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString() // Formater la date
    }));

    res.status(200).json({
      username : user.username,
      count: user.log.length,
      _id: user._id,
      log: formattedLog
    })
  } catch (error) {
    res.status(500).json({error:'server error'})
  }
})

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
