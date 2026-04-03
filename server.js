const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith('.vercel.app')) return true;
  } catch {}
  return false;
};

app.use(cors({
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/IT_MIS', {
      dbName: 'IT_MIS',
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB Connected to IT_MIS database');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    throw err;
  }
}

const userSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: 'password123' },
  role: { type: String, required: true },
  jobType: String,
  experience: String,
  system: String,
  dateOfJoining: Date
}, { timestamps: true });

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  addedBy: { type: String, required: true },
  assignedTo: { type: String, default: 'Unassigned' }
}, { timestamps: true });

const inventoryRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  requestedBy: { type: String, required: true },
  requestedByEmail: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  dateSubmitted: { type: Date, default: Date.now },
  reviewedBy: String,
  reviewedAt: Date
}, { timestamps: true });

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  fileName: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
});

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  time: String,
  startTime: String,
  endTime: String,
  createdBy: { type: String, required: true },
  assignedTo: [String]
}, { timestamps: true });

const querySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  postedBy: { type: String, required: true },
  postedByEmail: { type: String, required: true },
  status: { type: String, default: 'open' },
  answers: [{
    answer: String,
    answeredBy: String,
    answeredByEmail: String,
    answeredAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const requestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  requestType: { type: String, required: true },
  description: { type: String, required: true },
  dateSubmitted: { type: Date, default: Date.now },
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'Pending' },
  attachments: String
}, { timestamps: true });

const leaveSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  leaveType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  numberOfDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const InventoryRequest = mongoose.model('InventoryRequest', inventoryRequestSchema);
const Document = mongoose.model('Document', documentSchema);
const Meeting = mongoose.model('Meeting', meetingSchema);
const Query = mongoose.model('Query', querySchema);
const Request = mongoose.model('Request', requestSchema);
const Leave = mongoose.model('Leave', leaveSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = email.endsWith('@admin.com') ? 'admin' : 'user';
    const rollNo = 'U' + Date.now();
    
    const user = new User({
      rollNo: rollNo,
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
      dateOfJoining: new Date()
    });
    
    await user.save();
    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });
    
    res.json({ role: user.role, name: user.name, email: user.email, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/user-profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/user-meetings/:email', async (req, res) => {
  try {
    const meetings = await Meeting.find({ 
      $or: [
        { assignedTo: req.params.email },
        { assignedTo: { $in: [req.params.email] } }
      ]
    });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/queries', async (req, res) => {
  try {
    const queries = await Query.find().sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/add-query', async (req, res) => {
  try {
    const query = new Query(req.body);
    await query.save();
    res.status(201).json(query);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/answer-query/:id', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    query.answers.push(req.body);
    query.status = 'answered';
    await query.save();
    res.json(query);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/delete-query/:id', async (req, res) => {
  try {
    await Query.findByIdAndDelete(req.params.id);
    res.json({ message: 'Query deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/add-user', async (req, res) => {
  try {
    // Auto-generate roll number if not provided
    if (!req.body.rollNo) {
      const userCount = await User.countDocuments();
      req.body.rollNo = `USR${String(userCount + 1).padStart(4, '0')}`;
    }
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/update-user/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/delete-user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/get-inventory', async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/add-inventory', async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/update-inventory/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/delete-inventory/:id', async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/inventory-requests', async (req, res) => {
  try {
    const requests = await InventoryRequest.find().sort({ dateSubmitted: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/inventory-requests/:email', async (req, res) => {
  try {
    const requests = await InventoryRequest.find({ requestedByEmail: req.params.email }).sort({ dateSubmitted: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/inventory-requests', async (req, res) => {
  try {
    const count = await InventoryRequest.countDocuments();
    const requestId = `INV${String(count + 1).padStart(4, '0')}`;
    const request = new InventoryRequest({ ...req.body, requestId });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/inventory-requests/:id', async (req, res) => {
  try {
    const request = await InventoryRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/inventory-requests/:id', async (req, res) => {
  try {
    await InventoryRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inventory request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const docs = await Document.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/add-document', upload.single('file'), async (req, res) => {
  try {
    const doc = new Document({
      ...req.body,
      fileName: req.file.filename
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/delete-document/:id', async (req, res) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/meetings', async (req, res) => {
  try {
    const meetings = await Meeting.find();
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/add-meeting', async (req, res) => {
  try {
    const meeting = new Meeting(req.body);
    await meeting.save();
    res.status(201).json(meeting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/delete-meeting/:id', async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/requests', async (req, res) => {
  try {
    const requests = await Request.find().sort({ dateSubmitted: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const request = new Request(req.body);
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/requests/:id', async (req, res) => {
  try {
    const request = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/leaves', async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ submittedAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/leaves/:email', async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeEmail: req.params.email }).sort({ submittedAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/leaves', async (req, res) => {
  try {
    const leave = new Leave(req.body);
    await leave.save();
    res.status(201).json(leave);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/leaves/:id', async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(leave);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/leaves/:id', async (req, res) => {
  try {
    await Leave.findByIdAndDelete(req.params.id);
    res.json({ message: 'Leave request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch {
    process.exit(1);
  }
}

startServer();




