# Backend Deployment Guide

This guide explains how to deploy the HRMS backend API to a hosting service like Render.com.

## Prerequisites
- A Render.com account (or similar hosting service)
- Your MongoDB Atlas database

## Deployment Steps for Render.com

1. **Create a Render Account**
   - Sign up at [render.com](https://render.com)

2. **Create a New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your HRMS project

3. **Configure the Web Service**
   - **Name**: `hrms-backend` (or your preferred name)
   - **Root Directory**: `server` (important: select the server directory, not the root)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Select the Free plan (or paid plan if needed)

4. **Set Environment Variables**
   - Scroll down to the "Environment" section
   - Add the following environment variables:

   | Key | Value |
   |-----|-------|
   | MONGO_URI | mongodb+srv://admin:Ali123%40%40@cluster0.3h3uy.mongodb.net/GRH?retryWrites=true&w=majority |
   | JWT_SECRET | Alihermi1920 |
   | PORT | 10000 |
   | NODE_ENV | production |

   > Note: Render will automatically assign a port, but you can set PORT as a fallback.

5. **Deploy**
   - Click "Create Web Service"
   - Wait for the deployment to complete (this may take a few minutes)

6. **Get Your API URL**
   - Once deployed, Render will provide a URL like `https://hrms-backend.onrender.com`
   - This is your backend API URL that you'll need to enter in Vercel

## CORS Configuration

Make sure your backend has CORS configured to allow requests from your Vercel frontend domain:

```javascript
// In your server/index.js or server/app.js file
const cors = require('cors');

// Configure CORS
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

## Testing Your Deployment

1. **Check the API Status**
   - Visit `https://your-backend-url.onrender.com/api/health` or any health check endpoint
   - You should see a success response

2. **Test Authentication**
   - Try logging in through your frontend after setting the correct API URL

## Troubleshooting

- **Connection Issues**: Make sure your MongoDB connection string is correct and the IP is whitelisted in MongoDB Atlas
- **CORS Errors**: Ensure your CORS configuration includes your Vercel domain
- **Deployment Failures**: Check the build logs in Render for any errors

## Alternative Hosting Options

### Heroku

1. **Install Heroku CLI**
   ```
   npm install -g heroku
   ```

2. **Login to Heroku**
   ```
   heroku login
   ```

3. **Create a new Heroku app**
   ```
   heroku create hrms-backend-api
   ```

4. **Set Environment Variables**
   ```
   heroku config:set MONGO_URI=mongodb+srv://admin:Ali123%40%40@cluster0.3h3uy.mongodb.net/GRH?retryWrites=true&w=majority
   heroku config:set JWT_SECRET=Alihermi1920
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**
   ```
   git subtree push --prefix server heroku main
   ```

### Railway

1. **Create a Railway account** at [railway.app](https://railway.app)
2. **Create a new project** and connect your GitHub repository
3. **Configure the deployment** to use the server directory
4. **Set environment variables** in the Railway dashboard
5. **Deploy** your application

## Maintenance

- **Logs**: Check your hosting service's logs for debugging
- **Updates**: When you push changes to your repository, most services will automatically rebuild and deploy your backend
- **Scaling**: If needed, upgrade your hosting plan for better performance
