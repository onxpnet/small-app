FROM --platform=linux/x86_64 node:20.9.0-bullseye-slim

WORKDIR /opt/app

COPY . .
RUN npm install

CMD ["node", "--require", "./tracer.js", "index.js"]
