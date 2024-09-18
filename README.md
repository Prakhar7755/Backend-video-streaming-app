# Video Streaming App Backend

This repository contains the backend code for a video streaming application similar to YouTube. The application is built using Node.js and various libraries to handle user authentication, file uploads, and database management.

## Technologies Used

- **Express**: A web application framework for Node.js, used for building APIs.
- **Mongoose**: An ODM (Object Data Modeling) library for MongoDB and Node.js, facilitating database interactions.
- **JWT (JSON Web Token)**: A compact, URL-safe means of representing claims to be transferred between two parties, used for user authentication.
- **bcrypt**: A library for hashing passwords, ensuring secure user authentication.
- **Cloudinary**: A cloud service that offers image and video management, including storage and transformations.
- **Multer**: A middleware for handling `multipart/form-data`, used for uploading files.

## Features

- User registration and authentication using JWT.
- Secure password storage with bcrypt.
- Video upload and storage using Cloudinary.
- RESTful API for video management (CRUD operations).

## Getting Started

### Prerequisites

- Node.js
- MongoDB
- A Cloudinary account (for storing videos)

### Installation

1. Clone the repository:

   ```bash
  git clone https://github.com/Prakhar7755/video-streaming-app-BACKEND.git
   ```

2. Navigate to the project directory:

   ```bash
   cd video-streaming-app-BACKEND
   ```

3. Install the required packages:

   ```bash
   npm install
   ```

4. Set up environment variables. Create a `.env` file in the root directory with the following keys:

   ```
   PORT=8000
MONGODB_URI=
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=


REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=

NODE_ENV=""

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
   ```

5. Start the server:

   ```bash
   npm run dev
   ```


## Contributing

If you'd like to contribute, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.

---

Feel free to customize any sections as needed!
