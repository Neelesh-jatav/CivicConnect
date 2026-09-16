https://chatgpt.com/share/6aaad360-c5e4-83ee-a078-9ee72a5043d2

Absolutely. Let’s build **one very small project from zero** that teaches all of these together:

> **Frontend → Backend → API → MongoDB → Registration/Login → JWT → Authentication → Authorization → CRUD → API Integration**

We will make a **Simple Task Manager**.

The project will intentionally use **very little code** and plain HTML/CSS/JavaScript on the frontend so you can understand what is happening before moving to React/MERN.

---

# 🚀 Project: Simple Task Manager

### What the application will do

A user can:

1. Register
2. Login
3. Receive a JWT token
4. Create tasks
5. View only their own tasks
6. Update tasks
7. Delete tasks
8. Logout

This single project teaches:

```text
Frontend
   ↓
HTTP Request
   ↓
REST API
   ↓
Express Backend
   ↓
MongoDB
```

And authentication:

```text
Register
   ↓
Password hashed
   ↓
MongoDB

Login
   ↓
Verify password
   ↓
JWT generated
   ↓
Frontend stores JWT
   ↓
JWT sent with API requests
   ↓
Backend verifies JWT
   ↓
User identified
   ↓
Authorization
   ↓
CRUD operation
```

---

# 1. Final Project Structure

Create this:

```text
simple-task-app/
│
├── backend/
│   │
│   ├── server.js
│   ├── .env
│   ├── package.json
│   │
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   └── routes/
│       ├── auth.js
│       └── tasks.js
│
└── frontend/
    │
    ├── index.html
    ├── style.css
    └── script.js
```

Don't worry if this looks like a lot.

The actual code will be relatively small.

---

# 2. Step 1 — Create the project

Open terminal:

```bash
mkdir simple-task-app
cd simple-task-app
```

Create backend:

```bash
mkdir backend
cd backend
npm init -y
```

Install packages:

```bash
npm install express mongoose bcryptjs jsonwebtoken cors dotenv
```

These packages have specific jobs:

| Package        | Purpose                           |
| -------------- | --------------------------------- |
| `express`      | Backend/server                    |
| `mongoose`     | Connect Node.js to MongoDB        |
| `bcryptjs`     | Hash passwords                    |
| `jsonwebtoken` | Create/verify JWT                 |
| `cors`         | Allow frontend → backend requests |
| `dotenv`       | Read `.env` variables             |

---

# 3. Step 2 — Create the Server

Create:

```text
backend/server.js
```

Put:

```javascript
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
```

---

# 4. Understand Server Creation

This:

```javascript
const express = require("express");
```

imports Express.

Then:

```javascript
const app = express();
```

creates the Express application.

Think:

```text
Express
   ↓
app
   ↓
Our backend application
```

---

## Middleware

```javascript
app.use(cors());
```

allows requests from another origin, such as:

```text
Frontend: http://127.0.0.1:5500
Backend:  http://localhost:5000
```

Without CORS, browser security can block the request.

---

This:

```javascript
app.use(express.json());
```

allows Express to understand JSON.

For example frontend sends:

```json
{
  "title": "Learn JWT"
}
```

Express can then access:

```javascript
req.body.title
```

---

# 5. Your First API

We created:

```javascript
app.get("/", (req, res) => {
  res.send("Server is running");
});
```

This is an API endpoint.

Its structure is:

```text
GET / 
```

If you open:

```text
http://localhost:5000/
```

you get:

```text
Server is running
```

---

# 6. Start the Server

Inside `backend`:

```bash
node server.js
```

You should see:

```text
Server running on port 5000
MongoDB Connected
```

If MongoDB is not connected yet, the server can still start, but database operations won't work.

---

# 7. Step 3 — MongoDB

You need MongoDB.

You can use:

* MongoDB locally
* MongoDB Atlas

For learning, imagine our database is:

```text
MongoDB
   ↓
taskApp
```

Inside:

```text
taskApp
│
├── users
│
└── tasks
```

---

# 8. MongoDB Schema

We need two collections.

## User

```text
User
│
├── name
├── email
└── password
```

## Task

```text
Task
│
├── title
├── completed
└── user
```

The important relationship is:

```text
User
  │
  │ owns
  ↓
Tasks
```

For example:

```text
User
_id = 101
email = abc@gmail.com

       ↓

Task
title = Learn MongoDB
user = 101
```

Therefore we know:

> This task belongs to this user.

This becomes important for **authorization**.

---

# 9. Create User Schema

Create:

```text
backend/models/User.js
```

```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    unique: true
  },

  password: String
});

module.exports = mongoose.model("User", userSchema);
```

That's our MongoDB schema.

---

# 10. Create Task Schema

Create:

```text
backend/models/Task.js
```

```javascript
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: String,

  completed: {
    type: Boolean,
    default: false
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

module.exports = mongoose.model("Task", taskSchema);
```

Notice:

```javascript
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
}
```

This stores the ID of the user who created the task.

---

# 11. Step 4 — Registration

Now we create our authentication API.

Create:

```text
backend/routes/auth.js
```

```javascript
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.json({
      message: "Registration successful",
      userId: user._id
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
```

---

# 12. Understand Registration Internally

Suppose frontend sends:

```json
{
  "name": "Rahul",
  "email": "rahul@gmail.com",
  "password": "123456"
}
```

Backend receives:

```javascript
req.body
```

So:

```javascript
const { name, email, password } = req.body;
```

becomes:

```text
name     = Rahul
email    = rahul@gmail.com
password = 123456
```

---

## Password Hashing

We DON'T store:

```text
123456
```

in MongoDB.

Instead:

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

Conceptually:

```text
123456
   ↓
bcrypt
   ↓
$2b$10$.............
```

MongoDB stores the hash.

---

# 13. Register API

Our endpoint is:

```text
POST /api/auth/register
```

But we haven't connected the route yet.

Go to:

```text
server.js
```

Add:

```javascript
const authRoutes = require("./routes/auth");

app.use("/api/auth", authRoutes);
```

So now:

```text
/api/auth
      +
/register
      ↓
/api/auth/register
```

---

# 14. Login

Add this to `auth.js`:

```javascript
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});
```

---

# 15. Login Internally

Suppose:

```text
Email:
rahul@gmail.com

Password:
123456
```

Frontend sends:

```http
POST /api/auth/login
```

with:

```json
{
  "email": "rahul@gmail.com",
  "password": "123456"
}
```

Backend finds:

```javascript
User.findOne({ email })
```

MongoDB returns:

```text
Rahul
rahul@gmail.com
hashed password
```

Then:

```javascript
bcrypt.compare(password, user.password)
```

checks:

```text
123456
   ↓
bcrypt
   ↓
compare with stored hash
   ↓
true
```

---

# 16. JWT

Now:

```javascript
jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);
```

creates a JWT.

Conceptually:

```text
User ID
   +
Secret Key
   +
Expiration
   ↓
JWT
```

Example:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

The frontend receives it.

---

# 17. `.env`

Create:

```text
backend/.env
```

Put:

```env
MONGO_URI=mongodb://127.0.0.1:27017/taskApp
JWT_SECRET=my_super_secret_key_123
```

If you're using MongoDB Atlas, put your Atlas connection string instead.

---

# 18. What JWT Actually Does

Important beginner concept:

### JWT does NOT store your password.

It basically says:

```text
"I successfully authenticated user 123."
```

The server signs that information.

Later frontend sends:

```http
Authorization: Bearer JWT_TOKEN
```

Backend verifies:

```text
Is this JWT valid?
        ↓
YES
        ↓
Which user?
        ↓
userId = 123
```

Now backend knows who is making the request.

---

# 19. Authentication vs Authorization

These two are extremely important.

### Authentication

> **Who are you?**

Example:

```text
Login
 ↓
Username/password verified
 ↓
JWT generated
```

### Authorization

> **What are you allowed to do?**

Example:

```text
User 123 requests Task 456
```

Backend checks:

```text
Does Task 456 belong to User 123?
```

If yes:

```text
ALLOW
```

If no:

```text
DENY
```

---

# 20. JWT Authentication Middleware

Create:

```text
backend/middleware/auth.js
```

```javascript
const jwt = require("jsonwebtoken");

function auth(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token"
    });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.userId;

    next();

  } catch (error) {

    res.status(401).json({
      message: "Invalid token"
    });

  }
}

module.exports = auth;
```

---

# 21. Understand Middleware

Suppose:

```text
GET /api/tasks
```

comes in.

Before reaching the actual API:

```text
Request
   ↓
auth middleware
   ↓
JWT verification
   ↓
tasks API
```

If JWT is invalid:

```text
Request
   ↓
auth
   ↓
❌ STOP
```

If JWT is valid:

```text
Request
   ↓
auth
   ↓
req.userId = 123
   ↓
next()
   ↓
API
```

---

# 22. CRUD API

Now create:

```text
backend/routes/tasks.js
```

Start:

```javascript
const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();
```

---

# 23. CREATE — POST

```javascript
router.post("/", auth, async (req, res) => {

  const task = await Task.create({
    title: req.body.title,
    user: req.userId
  });

  res.json(task);
});
```

API:

```text
POST /api/tasks
```

Request:

```json
{
  "title": "Learn JWT"
}
```

The backend automatically adds:

```text
user = req.userId
```

So MongoDB stores:

```json
{
  "title": "Learn JWT",
  "completed": false,
  "user": "USER_ID"
}
```

---

# 24. READ — GET

```javascript
router.get("/", auth, async (req, res) => {

  const tasks = await Task.find({
    user: req.userId
  });

  res.json(tasks);
});
```

This is extremely important:

```javascript
Task.find({
  user: req.userId
});
```

We don't return everyone's tasks.

We return:

```text
current user's tasks
```

That's authorization in practice.

---

# 25. UPDATE — PUT

```javascript
router.put("/:id", auth, async (req, res) => {

  const task = await Task.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.userId
    },
    {
      title: req.body.title,
      completed: req.body.completed
    },
    {
      new: true
    }
  );

  if (!task) {
    return res.status(404).json({
      message: "Task not found"
    });
  }

  res.json(task);
});
```

Notice:

```javascript
{
  _id: req.params.id,
  user: req.userId
}
```

This prevents User A from updating User B's task.

---

# 26. DELETE

```javascript
router.delete("/:id", auth, async (req, res) => {

  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.userId
  });

  if (!task) {
    return res.status(404).json({
      message: "Task not found"
    });
  }

  res.json({
    message: "Task deleted"
  });
});
```

Again:

```text
Task ID
+
User ID
```

must match.

---

# 27. Complete `tasks.js`

So your complete file is:

```javascript
const express = require("express");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();


// CREATE
router.post("/", auth, async (req, res) => {

  const task = await Task.create({
    title: req.body.title,
    user: req.userId
  });

  res.json(task);
});


// READ
router.get("/", auth, async (req, res) => {

  const tasks = await Task.find({
    user: req.userId
  });

  res.json(tasks);
});


// UPDATE
router.put("/:id", auth, async (req, res) => {

  const task = await Task.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.userId
    },
    {
      title: req.body.title,
      completed: req.body.completed
    },
    {
      new: true
    }
  );

  if (!task) {
    return res.status(404).json({
      message: "Task not found"
    });
  }

  res.json(task);
});


// DELETE
router.delete("/:id", auth, async (req, res) => {

  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    user: req.userId
  });

  if (!task) {
    return res.status(404).json({
      message: "Task not found"
    });
  }

  res.json({
    message: "Task deleted"
  });
});


module.exports = router;
```

---

# 28. Connect Task Routes

In:

```text
server.js
```

add:

```javascript
const taskRoutes = require("./routes/tasks");

app.use("/api/tasks", taskRoutes);
```

Now we have:

```text
/api/tasks
```

and the router adds:

```text
POST   /api/tasks
GET    /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

---

# 29. Complete Backend

Your backend now looks like:

```text
backend/
│
├── server.js
│
├── .env
│
├── models/
│   ├── User.js
│   └── Task.js
│
├── middleware/
│   └── auth.js
│
└── routes/
    ├── auth.js
    └── tasks.js
```

And conceptually:

```text
                 SERVER
                   │
          ┌────────┴────────┐
          ↓                 ↓
     Auth Routes       Task Routes
          │                 │
          ↓                 ↓
     Register/Login      CRUD
          │                 │
          ↓                 ↓
        User              Task
          │                 │
          └────────┬────────┘
                   ↓
                MongoDB
```

---

# 30. Step 5 — Frontend

Now create:

```text
frontend/
```

with:

```text
index.html
style.css
script.js
```

---

# 31. `index.html`

Keep it extremely simple:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Task Manager</title>
  <link rel="stylesheet" href="style.css">
</head>

<body>

  <h1>Simple Task Manager</h1>

  <div id="auth">

    <h2>Register</h2>

    <input id="name" placeholder="Name">
    <input id="email" placeholder="Email">
    <input id="password" placeholder="Password">

    <button onclick="register()">Register</button>

    <h2>Login</h2>

    <input id="loginEmail" placeholder="Email">
    <input id="loginPassword" placeholder="Password">

    <button onclick="login()">Login</button>

  </div>


  <div id="app">

    <h2>My Tasks</h2>

    <input id="task" placeholder="New task">

    <button onclick="createTask()">
      Add Task
    </button>

    <button onclick="logout()">
      Logout
    </button>

    <ul id="tasks"></ul>

  </div>

  <script src="script.js"></script>

</body>
</html>
```

---

# 32. `script.js`

Start:

```javascript
const API = "http://localhost:5000/api";
```

This is our backend address.

---

# 33. Register From Frontend

```javascript
async function register() {

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const response = await fetch(
    `${API}/auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        name,
        email,
        password
      })
    }
  );

  const data = await response.json();

  alert(data.message);
}
```

---

# 34. Understand Frontend → Backend

This:

```javascript
fetch(`${API}/auth/register`)
```

means:

```text
Frontend
   ↓
POST request
   ↓
http://localhost:5000/api/auth/register
```

The body:

```javascript
JSON.stringify({
  name,
  email,
  password
})
```

becomes:

```json
{
  "name": "Rahul",
  "email": "rahul@gmail.com",
  "password": "123456"
}
```

Backend receives it through:

```javascript
req.body
```

---

# 35. Login Frontend

```javascript
async function login() {

  const email =
    document.getElementById("loginEmail").value;

  const password =
    document.getElementById("loginPassword").value;

  const response = await fetch(
    `${API}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json();

  if (data.token) {

    localStorage.setItem(
      "token",
      data.token
    );

    alert("Login successful");

    getTasks();
  }
}
```

---

# 36. Where is JWT Stored?

Here:

```javascript
localStorage.setItem(
  "token",
  data.token
);
```

Browser:

```text
localStorage

token
 ↓
eyJhbGciOiJIUzI1Ni...
```

For this beginner project, localStorage makes the flow easy to understand. In production applications, authentication storage has additional security considerations.

---

# 37. Get Tasks

```javascript
async function getTasks() {

  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `${API}/tasks`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const tasks = await response.json();

  const list =
    document.getElementById("tasks");

  list.innerHTML = "";

  tasks.forEach(task => {

    const li = document.createElement("li");

    li.innerHTML = `
      ${task.title}

      <button onclick="deleteTask('${task._id}')">
        Delete
      </button>
    `;

    list.appendChild(li);
  });
}
```

---

# 38. This Is the Most Important Connection

Look at:

```javascript
Authorization: `Bearer ${token}`
```

Frontend sends:

```text
GET /api/tasks
```

with:

```text
Authorization:
Bearer eyJhbGciOiJIUzI1Ni...
```

Backend:

```javascript
req.headers.authorization
```

gets it.

Then:

```javascript
jwt.verify(...)
```

checks it.

Then:

```javascript
req.userId = decoded.userId;
```

identifies the user.

Then:

```javascript
Task.find({
    user: req.userId
})
```

returns that user's tasks.

---

# 39. Create Task

```javascript
async function createTask() {

  const title =
    document.getElementById("task").value;

  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `${API}/tasks`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`
      },

      body: JSON.stringify({
        title
      })
    }
  );

  const data = await response.json();

  console.log(data);

  document.getElementById("task").value = "";

  getTasks();
}
```

---

# 40. Delete Task

```javascript
async function deleteTask(id) {

  const token =
    localStorage.getItem("token");

  await fetch(
    `${API}/tasks/${id}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  getTasks();
}
```

---

# 41. Logout

```javascript
function logout() {

  localStorage.removeItem("token");

  alert("Logged out");
}
```

---

# 42. Complete `script.js`

```javascript
const API = "http://localhost:5000/api";


// REGISTER
async function register() {

  const name =
    document.getElementById("name").value;

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  const response = await fetch(
    `${API}/auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        name,
        email,
        password
      })
    }
  );

  const data = await response.json();

  alert(data.message);
}


// LOGIN
async function login() {

  const email =
    document.getElementById("loginEmail").value;

  const password =
    document.getElementById("loginPassword").value;

  const response = await fetch(
    `${API}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json();

  if (data.token) {

    localStorage.setItem(
      "token",
      data.token
    );

    alert("Login successful");

    getTasks();
  }
}


// GET TASKS
async function getTasks() {

  const token =
    localStorage.getItem("token");

  if (!token) {
    return;
  }

  const response = await fetch(
    `${API}/tasks`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const tasks = await response.json();

  const list =
    document.getElementById("tasks");

  list.innerHTML = "";

  tasks.forEach(task => {

    const li =
      document.createElement("li");

    li.innerHTML = `
      ${task.title}

      <button
        onclick="deleteTask('${task._id}')">
        Delete
      </button>
    `;

    list.appendChild(li);
  });
}


// CREATE TASK
async function createTask() {

  const title =
    document.getElementById("task").value;

  const token =
    localStorage.getItem("token");

  await fetch(
    `${API}/tasks`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },

      body: JSON.stringify({
        title
      })
    }
  );

  document.getElementById("task").value = "";

  getTasks();
}


// DELETE TASK
async function deleteTask(id) {

  const token =
    localStorage.getItem("token");

  await fetch(
    `${API}/tasks/${id}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  getTasks();
}


// LOGOUT
function logout() {

  localStorage.removeItem("token");

  alert("Logged out");
}
```

---

# 43. Simple CSS

`style.css`:

```css
body {
  font-family: Arial;
  max-width: 600px;
  margin: 40px auto;
}

input {
  display: block;
  margin: 8px 0;
  padding: 10px;
}

button {
  padding: 8px 12px;
  margin: 5px;
}

li {
  margin: 10px;
}
```

That's enough.

Don't spend time making the UI beautiful yet.

---

# 44. Complete Request Flow

Now let's understand the **entire application internally**.

Suppose Rahul registers.

### Step 1

Frontend:

```text
User enters:

Name = Rahul
Email = rahul@gmail.com
Password = 123456
```

↓

### Step 2

JavaScript:

```javascript
fetch("/api/auth/register", {
    method: "POST"
})
```

↓

### Step 3

Express receives:

```javascript
req.body
```

↓

### Step 4

Backend hashes:

```text
123456
   ↓
bcrypt
   ↓
HASH
```

↓

### Step 5

MongoDB:

```text
users

{
  name: Rahul,
  email: rahul@gmail.com,
  password: HASH
}
```

---

# 45. Login Flow

User enters:

```text
Email
Password
```

↓

```text
Frontend
```

↓

```http
POST /api/auth/login
```

↓

```text
Express
```

↓

```text
MongoDB
```

↓

```text
Find user
```

↓

```text
bcrypt.compare()
```

↓

```text
Password correct
```

↓

```text
JWT generated
```

↓

```text
Backend
   ↓
JWT
   ↓
Frontend
```

↓

```javascript
localStorage.setItem("token", token)
```

---

# 46. Creating a Task

User types:

```text
Learn REST API
```

Frontend sends:

```http
POST /api/tasks
Authorization: Bearer JWT
```

Body:

```json
{
  "title": "Learn REST API"
}
```

↓

Backend:

```text
JWT
 ↓
verify
 ↓
userId = 123
```

↓

Create:

```json
{
  "title": "Learn REST API",
  "completed": false,
  "user": "123"
}
```

↓

MongoDB.

---

# 47. Reading Tasks

Frontend:

```http
GET /api/tasks
```

with:

```http
Authorization: Bearer JWT
```

↓

JWT middleware:

```text
JWT valid?
   ↓
YES
   ↓
userId = 123
```

↓

MongoDB query:

```javascript
Task.find({
    user: 123
});
```

↓

MongoDB returns:

```text
User 123's tasks
```

↓

Backend:

```json
[
  {
    "title": "Learn REST API"
  },
  {
    "title": "Learn MongoDB"
  }
]
```

↓

Frontend displays them.

---

# 48. CRUD in One Table

| Operation | HTTP   | Endpoint         | MongoDB              |
| --------- | ------ | ---------------- | -------------------- |
| Create    | POST   | `/api/tasks`     | `create()`           |
| Read      | GET    | `/api/tasks`     | `find()`             |
| Update    | PUT    | `/api/tasks/:id` | `findOneAndUpdate()` |
| Delete    | DELETE | `/api/tasks/:id` | `findOneAndDelete()` |

Remember:

```text
C → POST
R → GET
U → PUT
D → DELETE
```

---

# 49. REST API Concept

Our API follows REST-style HTTP methods:

```text
POST   /api/tasks
GET    /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

Instead of:

```text
/createTask
/getTask
/updateTask
/deleteTask
```

REST commonly represents the resource:

```text
/tasks
```

and the HTTP method describes the operation.

---

# 50. Authentication + Authorization Together

This is the complete chain:

```text
             LOGIN
               ↓
        Email + Password
               ↓
        bcrypt verification
               ↓
              JWT
               ↓
        ┌──── FRONTEND ────┐
        │                  │
        ↓                  ↓
     POST task          GET tasks
        │                  │
        └────── JWT ───────┘
                 ↓
          Express Middleware
                 ↓
            jwt.verify()
                 ↓
              userId
                 ↓
            Authorization
                 ↓
        Does resource belong
           to this user?
                 ↓
               YES
                 ↓
             MongoDB
```

---

# 51. The Most Important Things You Should Learn From This

Don't just copy the project.

After implementing it, make sure you can explain these **10 things without looking at the code**:

### 1. Server

```javascript
const app = express();
```

What does it do?

---

### 2. API

What is:

```text
POST /api/auth/login
```

?

---

### 3. HTTP methods

Understand:

```text
GET
POST
PUT
DELETE
```

---

### 4. Request body

Understand:

```javascript
req.body
```

---

### 5. URL parameter

Understand:

```javascript
req.params.id
```

For:

```text
/api/tasks/123
```

---

### 6. Headers

Understand:

```javascript
req.headers.authorization
```

---

### 7. MongoDB schema

Understand:

```javascript
user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}
```

---

### 8. Password hashing

Understand:

```javascript
bcrypt.hash()
bcrypt.compare()
```

---

### 9. JWT

Understand:

```javascript
jwt.sign()
jwt.verify()
```

---

### 10. Middleware

Understand:

```text
Request
 ↓
Middleware
 ↓
Route
 ↓
Database
 ↓
Response
```

---

# 52. How You Should Practice This

Don't immediately jump to a huge MERN project.

Do this progression:

```text
DAY 1
│
├── Create Express server
├── GET API
└── Test API
```

↓

```text
DAY 2
│
├── MongoDB
├── Mongoose
├── Schema
└── CRUD
```

↓

```text
DAY 3
│
├── Registration
├── bcrypt
└── Login
```

↓

```text
DAY 4
│
├── JWT
├── Middleware
├── Authentication
└── Authorization
```

↓

```text
DAY 5
│
├── Frontend
├── fetch()
├── API integration
└── JWT requests
```

↓

```text
DAY 6
│
└── Build the complete Task Manager yourself
```

---

# 53. After You Understand This → MERN

Then replace:

```text
HTML
CSS
JavaScript
```

with:

```text
React
```

Your architecture becomes:

```text
                 React
                   │
                fetch()
                   │
                   ↓
             REST API
                   │
                   ↓
              Express
                   │
              Node.js
                   │
                   ↓
              Mongoose
                   │
                   ↓
               MongoDB
```

That's basically the foundation of a **MERN application**.

And your existing knowledge of React, Node/Express and MongoDB can then be connected much more naturally because you will understand **why each layer exists**, rather than just memorizing code.

### One important mental model

Keep this in your head while learning:

```text
FRONTEND
"I want to do something"
       ↓
API REQUEST
"POST /api/tasks"
       ↓
BACKEND
"Let me validate/process it"
       ↓
AUTHENTICATION
"Who are you?"
       ↓
AUTHORIZATION
"Are you allowed?"
       ↓
DATABASE
"Store/get/change the data"
       ↓
BACKEND
"Here is the result"
       ↓
FRONTEND
"Show it to the user"
```

That single flow connects **server creation + frontend/backend connection + REST API + API integration + MongoDB schema + registration + login + authentication + authorization + JWT + CRUD** into one project.
