# CivicConnect - Interview Ready Project Notes

## 1. Project Summary

**CivicConnect** is a MERN-based civic complaint management platform. Citizens can register, verify their email with an OTP, log in, submit complaints with image evidence, track complaint status, upload community media, and view public content. Admins and officers can manage complaints, update status, review analytics, and close complaints through an OTP verification flow.

**Technology stack**

- **Frontend:** React, Vite, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT stored in an HTTP-only cookie
- **Media:** Multer for multipart uploads and Cloudinary for cloud storage
- **Email and OTP:** Nodemailer and `otp-generator`

## 2. What Is an API?

API stands for **Application Programming Interface**. It is a defined way for two software systems to communicate. An API specifies:

- What request a client can send
- Which URL and HTTP method are used
- What data the request contains
- What response and status code the server returns

For example, the React application does not directly query MongoDB. It sends a request to the Express API, and the API validates the request, applies business rules, reads or writes data, and returns JSON.

```js
// Example client request
const response = await fetch('/api/v1/my-complaints', {
	credentials: 'include',
});

const data = await response.json();
```

## 3. What Is a REST API?

REST means **Representational State Transfer**. A REST API exposes resources through URLs and uses standard HTTP methods to operate on those resources. REST is an architectural style, not a programming language or a library.

| HTTP method         | Meaning     | Typical use             |
| ------------------- | ----------- | ----------------------- |
| `GET`             | Read data   | Fetch complaints        |
| `POST`            | Create data | Submit a complaint      |
| `PUT` / `PATCH` | Update data | Change complaint status |
| `DELETE`          | Remove data | Delete uploaded media   |

Important REST principles used in CivicConnect:

- **Resource-based URLs:** `/complaint/:id` represents a complaint resource.
- **Stateless requests:** Each protected request must carry authentication information; the server does not rely on a server-side session.
- **Standard status codes:** `200` for success, `201` for creation, `401` for unauthenticated requests, `403` for insufficient role permissions, and `404` when a resource is not found.
- **JSON responses:** The frontend and backend exchange structured JSON, except file uploads, which use `multipart/form-data`.

## 4. REST API Usage in This Project

The API server is created in `server/server.js`. All feature routers are mounted below the `/api/v1` prefix:

```js
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use('/api/v1', auth);
app.use('/api/v1', complaint);
app.use('/api/v1', otp);
app.use('/api/v1', user);
app.use('/api/v1', media);
app.use('/api/v1', sponsor);
app.use('/api/v1', ad);
app.use('/api/v1', notification);
```

This means the route declared as `/complaint` in `server/routes/complaintRoutes.js` is available as:

```text
POST /api/v1/complaint
```

### Main CivicConnect endpoints

| Feature                 | Method and endpoint                 | Access                   |
| ----------------------- | ----------------------------------- | ------------------------ |
| Send registration OTP   | `POST /api/v1/send-otp`           | Public                   |
| Verify registration OTP | `POST /api/v1/verify-otp`         | Public                   |
| Register                | `POST /api/v1/register`           | Public, multipart        |
| Login                   | `POST /api/v1/login`              | Public                   |
| Current user            | `GET /api/v1/me`                  | Authenticated            |
| Create complaint        | `POST /api/v1/complaint`          | Authenticated, multipart |
| My complaints           | `GET /api/v1/my-complaints`       | Authenticated            |
| All complaints          | `GET /api/v1/complaints`          | Admin                    |
| Update complaint        | `PUT /api/v1/complaint/:id`       | Admin or officer         |
| Close complaint         | `PUT /api/v1/complaint/:id/close` | Admin, OTP required      |
| Public media feed       | `GET /api/v1/media/feed`          | Public                   |
| Upload media            | `POST /api/v1/media/upload`       | Authenticated, multipart |
| Delete media            | `DELETE /api/v1/media/:id`        | Authenticated            |

The endpoint declarations are mainly in `server/routes/authRoutes.js`, `server/routes/complaintRoutes.js`, and `server/routes/mediaRoutes.js`.

## 5. MERN Architecture and Request Flow

```text
React dashboard
		-> fetch/Axios request
Express route
		-> authentication and role middleware
Controller
		-> Mongoose model / Cloudinary / email service
MongoDB or Cloudinary
		-> JSON response
React state and dashboard UI
```

The project separates responsibilities:

- **Routes** define URLs, HTTP methods, and middleware.
- **Middleware** handles authentication, authorization, file parsing, and error flow.
- **Controllers** contain request handling and business logic.
- **Models** define MongoDB document schemas.
- **Utilities/config** contain JWT, email, Multer, Cloudinary, and database helpers.
- **React components** render forms, dashboards, complaint cards, media feeds, and admin views.

## 6. JWT Authentication

JWT stands for **JSON Web Token**. It is a signed token containing claims such as the user ID. The server signs it with `JWT_SECRET`, and later verifies the signature before allowing access to protected routes.

In CivicConnect, `server/utils/jwtToken.js` creates the token and sends it in an HTTP-only cookie:

```js
const sendToken = (user, statusCode, res) => {
	const token = user.getJwtToken();

	const options = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
		path: '/',
	};

	res.status(statusCode).cookie('token', token, options).json({
		success: true,
		token,
		user,
	});
};
```

`server/middlewares/auth.js` protects routes by reading and verifying the cookie:

```js
export const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
	const { token } = req.cookies;

	if (!token) {
		return next(new ErrorHandler('Login first to access this resource.', 401));
	}

	const decoded = jwt.verify(token, process.env.JWT_SECRET);
	req.user = await User.findById(decoded.id);
	next();
});
```

Role-based authorization is applied after authentication:

```js
router.route('/complaints')
	.get(isAuthenticatedUser, authorizeRoles('admin'), getAllComplaints);
```

**Interview point:** Authentication answers, “Who is the user?” Authorization answers, “Is this user allowed to perform this action?”

## 7. User Registration, Authentication, and OTP

The registration flow is:

1. The user submits an email to `POST /api/v1/send-otp`.
2. The server generates an OTP, stores it with an expiration time, and sends it through Nodemailer.
3. The user submits the OTP to `POST /api/v1/verify-otp`.
4. After successful verification, the registration endpoint creates the user and optionally uploads an avatar.
5. On login, the password is checked with `bcryptjs`, and a JWT cookie is issued.

Example OTP generation from `server/controllers/authController.js`:

```js
const otp = otpGenerator.generate(6, {
	upperCaseAlphabets: false,
	specialChars: false,
	lowerCaseAlphabets: false,
});

user.otp = otp;
user.otpExpire = Date.now() + 15 * 60 * 1000;
await user.save();
```

**Security points:** OTPs expire, passwords are hashed, JWT secrets stay in environment variables, and the authentication cookie is HTTP-only so browser JavaScript cannot read it directly.

### Small registration and login example

The route definitions are in `server/routes/authRoutes.js`:

```js
router.post('/register', upload.single('avatar'), registerUser);
router.post('/login', loginUser);
router.get('/me', isAuthenticatedUser, getMe);
```

The controller validates the user, hashes the password through the Mongoose pre-save hook, and sends a JWT after login:

```js
// server/controllers/authController.js
export const loginUser = catchAsyncErrors(async (req, res, next) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email }).select('+password');

	if (!user || !(await user.comparePassword(password))) {
		return next(new ErrorHandler('Invalid email or password', 401));
	}

	sendToken(user, 200, res);
});
```

The registration request can be sent as `multipart/form-data` when it includes an avatar:

```js
const formData = new FormData();
formData.append('name', name);
formData.append('email', email);
formData.append('password', password);
formData.append('avatar', avatarFile);

await fetch('/api/v1/register', {
	method: 'POST',
	body: formData,
	credentials: 'include',
});
```

## 8. Complaint Form and CRUD Operations

CRUD means **Create, Read, Update, and Delete**.

- **Create:** A logged-in citizen submits `POST /api/v1/complaint` with title, description, category, location, and up to five evidence images.
- **Read:** Citizens read their own complaints through `/my-complaints`; admins and officers use role-protected listing endpoints.
- **Update:** Admins or officers update complaint status through `PUT /api/v1/complaint/:id`.
- **Delete/closure:** The application uses a controlled OTP-based closure workflow instead of allowing an arbitrary direct close.

The complaint route in `server/routes/complaintRoutes.js` composes middleware in a deliberate order:

```js
router.route('/complaint').post(
	isAuthenticatedUser,
	blockDemoWriteAccess,
	upload.array('images', 5),
	createComplaint
);
```

This first checks identity, blocks read-only demo accounts, parses the uploaded files, and finally calls the controller. `server/controllers/complaintController.js` uploads evidence to Cloudinary and stores the resulting URLs in the complaint document.

### Small complaint form example

The React form sends text fields and images using `FormData`. The field name `images` matches `upload.array('images', 5)` in the backend:

```jsx
// client/src/components/RaiseComplaint.jsx
const submitComplaint = async (event) => {
	event.preventDefault();
	const formData = new FormData(event.currentTarget);

	await fetch('/api/v1/complaint', {
		method: 'POST',
		body: formData,
		credentials: 'include',
	});
};

return (
	<form onSubmit={submitComplaint} encType="multipart/form-data">
		<input name="title" placeholder="Complaint title" required />
		<textarea name="description" placeholder="Describe the issue" required />
		<select name="category" required>
			<option value="Road">Road</option>
			<option value="Water">Water</option>
			<option value="Electricity">Electricity</option>
		</select>
		<input name="state" required />
		<input name="district" required />
		<input name="pincode" pattern="[0-9]{6}" required />
		<input name="images" type="file" multiple accept="image/*" />
		<button type="submit">Submit complaint</button>
	</form>
);
```

### Small authentication middleware example

```js
// server/middlewares/auth.js
const { token } = req.cookies;
if (!token) {
	return next(new ErrorHandler('Login first to access this resource.', 401));
}

const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findById(decoded.id);
next();
```

## 9. Cloudinary Media Handling

Cloudinary is a cloud media management service. CivicConnect does not store large image files directly inside MongoDB. Multer receives the multipart file, `uploadToCloudinary` uploads it to Cloudinary, and MongoDB stores the secure URL and metadata.

Relevant files:

- `server/config/cloudinary.js`: configures the Cloudinary client from environment variables.
- `server/utils/multer.js`: parses incoming file uploads.
- `server/utils/uploadToCloudinary.js`: uploads buffers or paths.
- `server/controllers/mediaController.js`: handles user media CRUD.
- `server/controllers/complaintController.js`: handles complaint evidence and resolution images.

Typical upload flow:

```js
router.post(
	'/media/upload',
	isAuthenticatedUser,
	blockDemoWriteAccess,
	upload.single('file'),
	uploadMedia
);
```

```js
const result = await uploadToCloudinary(
	req.file.buffer,
	req.file.mimetype,
	'media'
);

const media = await Media.create({
	user: req.user._id,
	url: result.url,
	publicId: result.public_id,
});
```

**Why Cloudinary?** It provides scalable storage, CDN delivery, transformations, and deletion by public ID. Keeping only URLs and metadata in MongoDB keeps documents smaller and the API easier to scale.

## 10. Database Connection

MongoDB is connected through Mongoose in `server/db.js`:

```js
import mongoose from 'mongoose';

const connectDB = async () => {
	await mongoose.connect(process.env.MONGO_URI);
	console.log('MongoDB connected');
};

export default connectDB;
```

The server connects to MongoDB before calling `app.listen`, so the application does not accept requests before its data layer is ready. Mongoose models such as `server/models/User.js`, `Complaint.js`, and `Media.js` provide schema validation and database operations.

### Database schemas

The following is a shortened interview version of the schemas in `server/models/User.js` and `server/models/Complaint.js`:

```js
// server/models/User.js
const userSchema = new mongoose.Schema({
	name: String,
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true, select: false },
	role: { type: String, enum: ['user', 'admin', 'officer'], default: 'user' },
	isVerified: { type: Boolean, default: false },
	otp: String,
	otpExpire: Date,
});

userSchema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 10);
	}
	next();
});
```

```js
// server/models/Complaint.js
const complaintSchema = new mongoose.Schema({
	title: { type: String, required: true, trim: true, maxLength: 100 },
	description: { type: String, required: true },
	category: {
		type: String,
		enum: ['Road', 'Electricity', 'Water', 'Accident', 'Disaster', 'Custom'],
		required: true,
	},
	state: { type: String, required: true },
	district: { type: String, required: true },
	pincode: { type: String, match: /^\d{6}$/, required: true },
	status: { type: String, default: 'Pending' },
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	images: [{ public_id: String, url: String }],
	createdAt: { type: Date, default: Date.now },
});
```

The `user` field creates a reference from each complaint to its submitting user. The `images` array stores Cloudinary identifiers and URLs, while the actual files remain in Cloudinary.

## 11. Server Creation and Middleware

`server/server.js` creates the Express application and registers middleware:

```js
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
	await connectDB();
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
```

The middleware responsibilities are:

- `express.json()` parses JSON request bodies.
- `cookieParser()` reads the JWT cookie.
- `cors()` permits the configured React frontend to call the API.
- `express.urlencoded()` parses URL-encoded form data.
- Route-specific Multer middleware parses file uploads.
- The final error middleware returns a consistent JSON error response.

## 12. Strong Interview Answer

> CivicConnect is a MERN civic complaint platform. The React frontend communicates with an Express REST API mounted under `/api/v1`. The API follows resource-based routes and HTTP methods for CRUD operations. MongoDB stores users, complaints, media, advertisements, and notifications through Mongoose. JWT authentication is issued after login and stored in an HTTP-only cookie; middleware verifies the token and applies role-based access for citizens, officers, and admins. Registration uses email OTP verification, passwords are hashed with bcrypt, and complaint or community images are parsed with Multer, uploaded to Cloudinary, and persisted as URLs in MongoDB. The server connects to MongoDB before listening for requests, and controllers keep business logic separate from routes and models.

## 13. Useful Files to Mention

| Area                 | File                                          |
| -------------------- | --------------------------------------------- |
| Express server       | `server/server.js`                          |
| Database             | `server/db.js`                              |
| Auth routes          | `server/routes/authRoutes.js`               |
| Complaint routes     | `server/routes/complaintRoutes.js`          |
| Media routes         | `server/routes/mediaRoutes.js`              |
| Auth middleware      | `server/middlewares/auth.js`                |
| JWT helper           | `server/utils/jwtToken.js`                  |
| Auth controller      | `server/controllers/authController.js`      |
| Complaint controller | `server/controllers/complaintController.js` |
| Media controller     | `server/controllers/mediaController.js`     |
| Cloudinary helper    | `server/utils/uploadToCloudinary.js`        |
| User schema          | `server/models/User.js`                     |
| Complaint schema     | `server/models/Complaint.js`                |
| Media schema         | `server/models/Media.js`                    |
