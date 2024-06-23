# BASE STAGE
FROM node:18-alpine AS base

WORKDIR /app/Face-Recognition-Client

COPY ./Face-Recognition-Client .

RUN npm install

RUN npm run build

WORKDIR /app/Face-Recognition-Server

COPY ./Face-Recognition-Server .

RUN npm install

# STEVE STAGE

FROM node:18-alpine

COPY --from=base /app/Face-Recognition-Server /app/Face-Recognition-Server
COPY --from=base /app/Face-Recognition-Client/build /app/Face-Recognition-Client/build

WORKDIR /app/Face-Recognition-Server

CMD ["node","index.js"]

# MY STAGE 
# COPY package*.json ./

# ENV PORT = 5000

# EXPOSE 5000

# CMD ["npm","start"]
