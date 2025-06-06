# Use a lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose the port
EXPOSE 4000

# Start the app
CMD ["npm", "run", "start:prod"]