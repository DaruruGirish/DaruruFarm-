# Use the official Node.js Alpine base image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy application source files
COPY . .

# Build the NestJS project
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "run", "start:prod"]
