const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const bcrypt = require('bcryptjs');

let users = [
  { _id: '1', rollNo: 'A001', name: 'Admin User', email: 'admin@test.com', password: '$2a$10$9/hB9/9.V.d.h0.J.p1j3.wL6.F/8.Q.y8.w.S.O.w.w.s.u.p.e.r', role: 'admin', jobType: 'Full-time', experience: '5 years', system: 'Windows', dateOfJoining: new Date() },
  { _id: '2', rollNo: 'U001', name: 'John Doe', email: 'john@user.com', password: '$2a$10$9/hB9/9.V.d.h0.J.p1j3.wL6.F/8.Q.y8.w.S.O.w.w.s.u.p.e.r', role: 'user', jobType: 'Full-time', experience: '3 years', system: 'Mac', dateOfJoining: new Date() },
  { _id: '3', rollNo: 'U002', name: 'Jane Smith', email: 'jane@user.com', password: '$2a$10$9/hB9/9.V.d.h0.J.p1j3.wL6.F/8.Q.y8.w.S.O.w.w.s.u.p.e.r', role: 'user', jobType: 'Part-time', experience: '2 years', system: 'Linux', dateOfJoining: new Date() }
];
let inventory = [
  { _id: '1', itemName: 'Laptop Dell XPS', category: 'Hardware', quantity: 10, addedBy: 'Admin', createdAt: new Date() },
  { _id: '2', itemName: 'Mouse Logitech', category: 'Accessories', quantity: 25, addedBy: 'Admin', createdAt: new Date() },
  { _id: '3', itemName: 'Monitor Samsung', category: 'Hardware', quantity: 8, addedBy: 'Admin', createdAt: new Date() }
];
let documents = [];
let meetings = [
  { _id: '1', title: 'Team Standup', description: 'Daily standup meeting', date: new Date(), time: '10:00 AM', createdBy: 'Admin', assignedTo: ['john@user.com'], createdAt: new Date() },
  { _id: '2', title: 'Project Review', description: 'Monthly project review', date: new Date(), time: '2:00 PM', createdBy: 'Admin', assignedTo: ['jane@user.com'], createdAt: new Date() }
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = users.find(u => u.email === email);
  if (existingUser) return res.status(400).json({ message: 'Email already exists' });
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    _id: Date.now().toString(),
    rollNo: 'U' + Date.now(),
    name,
    email,
    password: hashedPassword,
    role: 'user',
    jobType: '',
    experience: '',
    system: '',
    dateOfJoining: new Date()
  };
  users.push(newUser);
  res.status(201).json({ message: 'Account created successfully' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

  const token = jwt.sign({ role: user.role, name: user.name, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });
  res.json({ token, role: user.role, name: user.name, email: user.email });
});

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ message: 'Token is not valid' });
  }
};

app.get('/api/users', auth, (req, res) => res.json(users));
app.post('/api/add-user', auth, async (req, res) => {
  const { password, ...rest } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = { _id: Date.now().toString(), password: hashedPassword, ...rest };
  users.push(user);
  res.status(201).json(user);
});
app.put('/api/update-user/:id', auth, (req, res) => {
  const index = users.findIndex(u => u._id === req.params.id);
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    res.json(users[index]);
  } else res.status(404).json({ message: 'User not found' });
});
app.delete('/api/delete-user/:id', auth, (req, res) => {
  users = users.filter(u => u._id !== req.params.id);
  res.json({ message: 'User deleted' });
});

app.get('/api/get-inventory', auth, (req, res) => res.json(inventory));
app.post('/api/add-inventory', auth, (req, res) => {
  const item = { _id: Date.now().toString(), ...req.body };
  inventory.push(item);
  res.status(201).json(item);
});
app.put('/api/update-inventory/:id', auth, (req, res) => {
  const index = inventory.findIndex(i => i._id === req.params.id);
  if (index !== -1) {
    inventory[index] = { ...inventory[index], ...req.body };
    res.json(inventory[index]);
  } else res.status(404).json({ message: 'Item not found' });
});
app.delete('/api/delete-inventory/:id', auth, (req, res) => {
  inventory = inventory.filter(i => i._id !== req.params.id);
  res.json({ message: 'Item deleted' });
});

app.get('/api/documents', auth, (req, res) => res.json(documents));
app.post('/api/add-document', auth, upload.single('file'), (req, res) => {
  const doc = { _id: Date.now().toString(), ...req.body, fileName: req.file.filename, uploadDate: new Date() };
  documents.push(doc);
  res.status(201).json(doc);
});
app.delete('/api/delete-document/:id', auth, (req, res) => {
  documents = documents.filter(d => d._id !== req.params.id);
  res.json({ message: 'Document deleted' });
});

app.get('/api/meetings', auth, (req, res) => res.json(meetings));
app.post('/api/add-meeting', auth, (req, res) => {
  const meeting = { _id: Date.now().toString(), ...req.body };
  meetings.push(meeting);
  res.status(201).json(meeting);
});
app.delete('/api/delete-meeting/:id', auth, (req, res) => {
  meetings = meetings.filter(m => m._id !== req.params.id);
  res.json({ message: 'Meeting deleted' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Demo server running on port ${PORT} (No database required)`));
