FROM --platform=linux/x86_64 node:20.9.0-bullseye-slim as base
WORKDIR /opt/app

FROM --platform=linux/x86_64 base as builder
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm install

FROM --platform=linux/x86_64 base as runner
WORKDIR /opt/app
COPY . .
COPY --from=builder /opt/app/node_modules ./node_modules 

CMD ["node", "--require", "./tracer.js", "index.js"]
