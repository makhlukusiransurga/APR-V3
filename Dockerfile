# Use Node 20 LTS as base image
FROM node:20-alpine

# Set Timezone to Asia/Jakarta
ENV TZ=Asia/Jakarta
RUN apk add --no-cache tzdata

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install --production

# Bundle app source
COPY . .

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Command to run the app
CMD [ "npm", "start" ]
