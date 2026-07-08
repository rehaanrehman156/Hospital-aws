FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Expose React dev server port
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]

