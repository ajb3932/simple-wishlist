# Use Node.js 16 as the parent image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the application files to the container
COPY . .

# Make port 8092 available outside the container
EXPOSE 8092

# Define the command to run the app
CMD [ "node", "server.js" ]