FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port that the app runs on
EXPOSE 8800 3001

CMD ["npm", "start"]
