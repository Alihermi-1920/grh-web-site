# Vercel Deployment Guide for HRMS Frontend

This guide provides step-by-step instructions for deploying the HRMS frontend to Vercel.

## Prerequisites
- A Vercel account
- Your project code in a GitHub repository
- Your backend API already deployed and running (see server/BACKEND_DEPLOYMENT.md)

## Step 1: Prepare Your Project

Your project has already been prepared for deployment with:
- Environment variable configuration
- API URL utility functions
- Vercel configuration file

## Step 2: Deploy to Vercel

1. **Create a Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Connect your GitHub account

2. **Import Your Repository**
   - Click "Add New" → "Project"
   - Select your HRMS repository
   - Configure the project with these exact settings:

   | Setting | Value |
   |---------|-------|
   | Framework Preset | Create React App |
   | Root Directory | client |
   | Build Command | npm run build |
   | Output Directory | build |
   | Install Command | npm install |

3. **Set Environment Variables**
   - In the "Environment Variables" section, add:

   | Key | Value |
   |-----|-------|
   | REACT_APP_API_URL | https://your-backend-api.com |

   > Replace `https://your-backend-api.com` with your actual backend URL from Render.com or other hosting service.

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

## Step 3: Verify Your Deployment

1. **Check the Deployment**
   - Once the build is complete, Vercel will provide a URL for your deployed application
   - Visit the URL to ensure your application is working correctly

2. **Test Authentication**
   - Try logging in to verify the connection to your backend API
   - Test other features to ensure they're working as expected

## Troubleshooting

### Common Issues and Solutions

1. **API Connection Issues**
   - Check that your REACT_APP_API_URL is correct
   - Ensure your backend is running and accessible
   - Verify CORS is configured correctly on your backend

2. **Build Failures**
   - Check the build logs in Vercel for specific errors
   - Common issues include missing dependencies or build configuration problems

3. **Runtime Errors**
   - Use browser developer tools to check for JavaScript errors
   - Verify that all API calls are using the environment variable, not hardcoded URLs

## Custom Domain Setup (Optional)

1. **Add a Custom Domain**
   - In your Vercel project dashboard, go to "Settings" → "Domains"
   - Add your custom domain and follow the verification steps

2. **Configure DNS**
   - Update your domain's DNS settings according to Vercel's instructions
   - Wait for DNS propagation (can take up to 48 hours)

## Continuous Deployment

Vercel automatically sets up continuous deployment from your GitHub repository:

1. **Push Changes**
   - When you push changes to your repository, Vercel will automatically rebuild and deploy your application

2. **Preview Deployments**
   - Pull requests will get their own preview deployments
   - Use these to test changes before merging to your main branch

## Environment Variables Reference

Here's a complete list of environment variables you might need:

| Variable | Description | Required |
|----------|-------------|----------|
| REACT_APP_API_URL | URL of your backend API | Yes |
| REACT_APP_DEEPSEEK_API_KEY | API key for DeepSeek AI (if using) | No |

## Vercel Configuration

The `vercel.json` file in your project configures:
- SPA routing (all routes redirect to index.html)
- Cache control headers
- Other Vercel-specific settings

## Need Help?

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Create React App Deployment: [create-react-app.dev/docs/deployment](https://create-react-app.dev/docs/deployment)
- Contact your development team for project-specific issues
