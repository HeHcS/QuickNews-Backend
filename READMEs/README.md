# Video Platform Backend

This project is a backend API for a video platform with features like authentication, video management, and more.

## Project Structure

```
project/
├── config/        # Configuration files
├── controllers/   # Route controllers
├── middleware/    # Custom middleware
├── models/        # Database models
├── routes/        # API routes
├── utils/         # Utility functions
├── .env           # Environment variables (not tracked by git)
├── .env.example   # Example environment variables
├── .gitignore     # Git ignore file
├── package.json   # Project dependencies
└── server.js      # Entry point
```

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests

## API Endpoints

### Authentication

#### Register a new user
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Auth required**: No
- **Body**:
  ```
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: `201 CREATED`
  ```
  {
    "success": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": false
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
  ```

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Auth required**: No
- **Body**:
  ```
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: `200 OK`
  ```
  {
    "success": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": false
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
  ```

#### Refresh Access Token
- **URL**: `/api/auth/refresh-token`
- **Method**: `POST`
- **Auth required**: No
- **Body**:
  ```
  {
    "refreshToken": "jwt_refresh_token"
  }
  ```
- **Success Response**: `200 OK`
  ```
  {
    "success": true,
    "accessToken": "new_jwt_access_token"
  }
  ```

#### Forgot Password
- **URL**: `/api/auth/forgot-password`
- **Method**: `POST`
- **Auth required**: No
- **Body**:
  ```
  {
    "email": "john@example.com"
  }
  ```
- **Success Response**: `200 OK`
  ```
  {
    "success": true,
    "message": "If a user with that email exists, a password reset link has been sent"
  }
  ```

#### Reset Password
- **URL**: `/api/auth/reset-password/:resetToken`
- **Method**: `POST`
- **Auth required**: No
- **Body**:
  ```
  {
    "password": "newpassword123"
  }
  ```
- **Success Response**: `200 OK`
  ```
  {
    "success": true,
    "message": "Password reset successful",
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
  ```

#### Get Current User
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Auth required**: Yes (JWT Bearer Token)
- **Success Response**: `200 OK`
  ```
  {
    "success": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "profilePicture": "profile_picture_url",
      "isVerified": false,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  }
  ```

#### Logout
- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Auth required**: Yes (JWT Bearer Token)
- **Success Response**: `200 OK`
  ```
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

#### Google OAuth Login
- **URL**: `/api/auth/google`
- **Method**: `GET`
- **Auth required**: No
- **Description**: Redirects to Google OAuth consent screen

#### Google OAuth Callback
- **URL**: `/api/auth/google/callback`
- **Method**: `GET`
- **Auth required**: No
- **Description**: Callback URL for Google OAuth, returns JWT tokens after successful authentication

## Technologies

- Node.js
- Express.js
- MongoDB
- Passport.js for authentication
- JWT for authorization
