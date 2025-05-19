# HRMS Deployment Guide

This guide explains how to deploy the HRMS application to Vercel (frontend) and a separate hosting service for the backend.

## Frontend Deployment (Vercel)

### Prerequisites
- A Vercel account
- Your project code in a GitHub repository

### Steps

1. **Create a Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Connect your GitHub account

2. **Import Your Repository**
   - Click "Add New" → "Project"
   - Select your HRMS repository
   - Configure the project:
     - Framework Preset: Create React App
     - Root Directory: client
     - Build Command: npm run build
     - Output Directory: build
     - Install Command: npm install

3. **Set Environment Variables**
   - Add the following environment variables:
   
   | Key | Value |
   |-----|-------|
   | REACT_APP_API_URL | https://your-backend-api.com |
   | REACT_APP_DEEPSEEK_API_KEY | your_deepseek_api_key (if using DeepSeek AI) |

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

## Backend Deployment

You have several options for deploying your Node.js backend:

### Option 1: Render.com

1. **Create a Render Account**
   - Sign up at [render.com](https://render.com)

2. **Create a New Web Service**
   - Connect your GitHub repository
   - Configure:
     - Root Directory: server
     - Build Command: npm install
     - Start Command: node index.js
   
3. **Set Environment Variables**
   - Add all variables from your server/.env file:
   
   | Key | Value |
   |-----|-------|
   | MONGO_URI | mongodb+srv://... |
   | JWT_SECRET | your_jwt_secret |
   | PORT | 5000 |

### Option 2: Heroku

1. **Create a Heroku Account**
   - Sign up at [heroku.com](https://heroku.com)

2. **Install Heroku CLI**
   ```
   npm install -g heroku
   ```

3. **Login to Heroku**
   ```
   heroku login
   ```

4. **Create a new Heroku app**
   ```
   heroku create your-app-name
   ```

5. **Set Environment Variables**
   ```
   heroku config:set MONGO_URI=mongodb+srv://...
   heroku config:set JWT_SECRET=your_jwt_secret
   ```

6. **Deploy**
   ```
   git subtree push --prefix server heroku main
   ```

## Updating Your Code for Production

1. **Create a utility file for API URLs**
   - Create `client/src/utils/apiConfig.js`:
   ```javascript
   // API configuration
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

   // Helper function to build API URLs
   export const getApiUrl = (endpoint) => {
     const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
     return `${API_BASE_URL}${formattedEndpoint}`;
   };

   // Helper for file URLs
   export const getFileUrl = (filePath) => {
     if (!filePath) return '';
     if (filePath.startsWith('http')) return filePath;
     const formattedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
     return `${API_BASE_URL}${formattedPath}`;
   };

   export default API_BASE_URL;
   ```

2. **Update your API calls**
   - Import the utility:
   ```javascript
   import API_BASE_URL, { getApiUrl, getFileUrl } from '../utils/apiConfig';
   ```
   
   - Replace hardcoded URLs:
   ```javascript
   // Before
   const response = await fetch("http://localhost:5000/api/employees");
   
   // After
   const response = await fetch(getApiUrl("api/employees"));
   ```
   
   - For file URLs:
   ```javascript
   // Before
   <img src={"http://localhost:5000" + doc.filePath} />
   
   // After
   <img src={getFileUrl(doc.filePath)} />
   ```

## Testing Your Deployment

1. **Test the frontend**
   - Visit your Vercel deployment URL
   - Try logging in and using different features

2. **Test the backend**
   - Visit your backend URL + an API endpoint (e.g., /api/health)
   - Check if it returns the expected response

## Troubleshooting

- **CORS Issues**: Make sure your backend has CORS configured to allow requests from your Vercel domain
- **404 Errors**: Check that your API routes are correctly defined
- **Database Connection Issues**: Verify your MongoDB connection string is correct and the IP is whitelisted
- **Environment Variables**: Ensure all required environment variables are set correctly

## Maintenance

- **Logs**: Check Vercel and your backend hosting service for logs to debug issues
- **Updates**: When you push changes to your repository, Vercel will automatically rebuild and deploy your frontend
