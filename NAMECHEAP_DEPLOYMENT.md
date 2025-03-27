# Deploying Task Management App on Namecheap cPanel

This guide explains how to deploy both the client and server parts of the Task Management application on Namecheap using cPanel's Node.js application feature.

## Prerequisites

1. A Namecheap hosting account with cPanel access
2. Node.js Selector enabled on your cPanel (contact Namecheap support if not available)
3. Access to domain/subdomain configuration

## Server Deployment

### Step 1: Upload Server Files

1. Log into your cPanel account
2. Navigate to File Manager
3. Navigate to the directory where you want to host your server (e.g., `testbackend.berrysol.com`)
4. Upload all server files from your `server` folder, excluding `.git`, `.github` and `node_modules`

### Step 2: Configure Node.js App in cPanel

1. In cPanel, find and click on "Node.js Selector"
2. Click "Create Application"
3. Fill in the following details:
   - Node.js version: Select the compatible version (recommended: Node.js 16.x or higher)
   - Application mode: Production
   - Application root: The directory path where you uploaded server files
   - Application URL: Your server subdomain (e.g., testbackend.berrysol.com)
   - Application startup file: `index.js`
   - Environment variables:
     ```
     PORT=3000
     NODE_ENV=production
     ```
     (Add any other environment variables your application needs)

4. Click "Create" to set up the application

### Step 3: Install Dependencies

1. In cPanel, go to "Terminal" or use SSH access
2. Navigate to your server directory:
   ```
   cd testbackend.berrysol.com
   ```
3. Install dependencies:
   ```
   npm install --production
   ```

### Step 4: Start and Test Server

1. In the Node.js Selector, find your application and click "Start"
2. Test your API by accessing your server URL (e.g., https://testbackend.berrysol.com)

## Client Deployment

For the client, since it's a React application built with Vite, you need to either:

### Option 1: Direct Upload (Static Files)

1. In your local development environment, build the client:
   ```
   cd client
   npm run build
   ```
2. Upload the contents of the `dist` folder to your client domain directory (e.g., `app.berrysol.com`)

### Option 2: Build on Server Using Node.js Selector

1. Upload the client files to a directory on your cPanel (e.g., `app.berrysol.com`)
2. Create a new Node.js application in Node.js Selector
3. Set the application root to your client directory
4. Install dependencies:
   ```
   cd app.berrysol.com
   npm install
   npm run build
   ```
5. Configure your domain to serve from the `dist` directory

## Setting Up .htaccess for Client

Create an `.htaccess` file in your client directory with the following content:

```
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

This ensures that client-side routing works correctly.

## Database Configuration

Make sure to update your server's database configuration to connect to your production database. In your `server/config/database.js` file, configure the production database settings.

## Troubleshooting

### Server Issues

- Check the error logs in cPanel
- Verify environment variables are set correctly
- Ensure database connections are properly configured

### Client Issues

- Check browser console for errors
- Verify API endpoints are correctly pointing to your server URL
- Make sure .htaccess file is correctly set up for client-side routing

## Maintenance

To update your application:

1. Upload new files to the respective directories
2. For server changes, restart the Node.js application
3. For client changes, rebuild if necessary and upload the new build files

## Automatic Deployment

You can also set up GitHub Actions to automatically deploy your application to Namecheap. Refer to your project's `.github/workflows/namecheap-deploy.yml` file for the automated deployment configuration.