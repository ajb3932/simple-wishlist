# Build stage
FROM node:16-alpine AS build

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

RUN echo hello

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Production stage
FROM node:16-alpine

WORKDIR /usr/src/app

# Copy built node modules and compiled code from the build stage
COPY --from=build /usr/src/app .

# Expose the port the app runs on
EXPOSE 8092

# Start the app
CMD ["node", "server.js"]