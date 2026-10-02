const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));

app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const users = [];
const exercises = [];

const generateId = () => Math.random().toString(36).substring(2, 11);

app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const newUser = {
    username: username,
    _id: generateId()
  };

  users.push(newUser);
  res.json(newUser);
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id || req.body[':_id'];
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  let exerciseDate;
  if (!date) {
    exerciseDate = new Date();
  } else {
    const parsedDate = new Date(date.includes('T') ? date : `${date}T00:00:00`);
    exerciseDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }

  const dateString = exerciseDate.toDateString();

  const newExercise = {
    userId: user._id,
    description: String(description),
    duration: Number(duration),
    date: dateString,
    rawDate: exerciseDate.getTime()
  };

  exercises.push(newExercise);

  res.json({
    _id: user._id,
    username: user.username,
    date: dateString,
    duration: Number(duration),
    description: String(description)
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { from, to, limit } = req.query;

  let userExercises = exercises.filter(e => e.userId === userId);

  if (from) {
    const fromDate = new Date(`${from}T00:00:00`).getTime();
    if (!isNaN(fromDate)) {
      userExercises = userExercises.filter(e => e.rawDate >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(`${to}T23:59:59`).getTime();
    if (!isNaN(toDate)) {
      userExercises = userExercises.filter(e => e.rawDate <= toDate);
    }
  }

  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum)) {
      userExercises = userExercises.slice(0, limitNum);
    }
  }

  const log = userExercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date
  }));

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});