# quizzapp

Gravity Quiz App for number estimation questions.

## How to run
### In a docker container
- Create docker image:  ```./docker-build.sh```
- Either:
    - Use ```docker-compose.yml``` to automatically create and link a Docker volume for persistency and run the container
    - Manually
        - Create volume: ```docker volume create quizzapp_db```
        - Run container: ```docker run -d -p 3000:3000 --name quizzapp-container -v quizzapp_db:/db quizzapp```

### Locally
#### Prerequisites
- Install node.js including npm (see platform specific documentation on [Node.js website](https://nodejs.org/en/download)).
- Install ts-node to be able to execute Typescript files: ```npm install -g ts-node```

#### Install dependencies
- Run ```npm install```

#### Start app
- Run ```ts-node src/start.ts```

## UIs
- Host UI: http://localhost:3000/host
- Player UI: http://localhost:3000/player