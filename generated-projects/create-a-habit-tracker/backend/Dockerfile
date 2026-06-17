FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Set environment variables for production
ENV NODE_ENV production

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "src/index.js"]
