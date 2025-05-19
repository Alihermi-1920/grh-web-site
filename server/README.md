# HRMS Backend API

This is the backend API for the HRMS (Human Resource Management System) project.

## Deployment on Render.com

### Configuration

When deploying to Render.com, use these settings:

1. **Name**: HRMS_PFE_ISET (or your preferred name)
2. **Root Directory**: server
3. **Environment**: Node
4. **Build Command**: npm ci && npm rebuild bcrypt --build-from-source
5. **Start Command**: node index.js
6. **Node Version**: 18.x (specified in package.json)

### Environment Variables

Add these environment variables:

| Key | Value |
|-----|-------|
| MONGO_URI | mongodb+srv://admin:Ali123%40%40@cluster0.3h3uy.mongodb.net/GRH?retryWrites=true&w=majority |
| JWT_SECRET | Alihermi1920 |
| PORT | 10000 |
| NODE_ENV | production |

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the required environment variables.

3. Start the development server:
   ```
   npm run dev
   ```

## API Routes

- `/api/auth` - Authentication routes
- `/api/employees` - Employee management
- `/api/departments` - Department management
- `/api/presence` - Attendance tracking
- `/api/reports` - Reports generation
- `/api/projects` - Project management
- `/api/qcm` - QCM management
- `/api/tasks` - Task management
- `/api/notifications` - Notifications
- `/api/conges` - Leave management
- `/api/evaluationresultat` - Evaluation results
- `/api/upload` - File uploads
- `/api/comments` - Comments
- `/api/password-change` - Password change
- `/api/maintenance` - Maintenance mode

## Troubleshooting

If you encounter issues with bcrypt on Render.com, the postinstall script in package.json will automatically rebuild it.
