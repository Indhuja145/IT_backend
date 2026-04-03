# IT-MIS Backend API

Backend server for IT Management Information System built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)

### Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file with:
```
MONGODB_URI=mongodb://localhost:27017/it-mis
PORT=5000
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## 📡 API Endpoints

### Authentication
- `POST /api/login` - User login

### Users
- `GET /api/users` - Get all users
- `POST /api/add-user` - Add new user
- `PUT /api/update-user/:id` - Update user
- `DELETE /api/delete-user/:id` - Delete user

### Inventory
- `GET /api/get-inventory` - Get all inventory items
- `POST /api/add-inventory` - Add new item
- `PUT /api/update-inventory/:id` - Update item
- `DELETE /api/delete-inventory/:id` - Delete item

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/add-document` - Upload document (multipart/form-data)
- `DELETE /api/delete-document/:id` - Delete document

### Meetings
- `GET /api/meetings` - Get all meetings
- `POST /api/add-meeting` - Add new meeting
- `DELETE /api/delete-meeting/:id` - Delete meeting

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **cors** - Enable CORS
- **multer** - File upload handling
- **dotenv** - Environment variables
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication

## 🗄️ Database Schema

### User
```javascript
{
  rollNo: String (unique),
  name: String,
  email: String (unique),
  password: String,
  role: String,
  jobType: String,
  experience: String,
  system: String,
  dateOfJoining: Date
}
```

### Inventory
```javascript
{
  itemName: String,
  category: String,
  quantity: Number,
  addedBy: String
}
```

### Document
```javascript
{
  title: String,
  description: String,
  category: String,
  uploadedBy: String,
  fileName: String,
  uploadDate: Date
}
```

### Meeting
```javascript
{
  title: String,
  description: String,
  date: Date,
  time: String,
  createdBy: String
}
```

## 🔧 Configuration

### MongoDB Connection
Update `MONGODB_URI` in `.env`:
- Local: `mongodb://localhost:27017/it-mis`
- Atlas: `mongodb+srv://username:password@cluster.mongodb.net/it-mis`

### Port Configuration
Default port is 5000. Change in `.env`:
```
PORT=5000
```

## 📁 Project Structure
```
backend/
├── server.js          # Main server file
├── uploads/           # Document storage
├── .env              # Environment variables
├── .gitignore        # Git ignore file
├── package.json      # Dependencies
└── README.md         # Documentation
```

## 🛠️ Development

Install nodemon for auto-reload:
```bash
npm install -g nodemon
npm run dev
```

## 🔐 Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Implement proper authentication with JWT
- Add input validation and sanitization
- Use HTTPS in production

## 📝 License

MIT
# IT_backend
