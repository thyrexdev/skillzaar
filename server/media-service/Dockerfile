FROM oven/bun:latest

WORKDIR /src

RUN apt-get update -y && apt-get install -y openssl

# Copy root workspace configuration
COPY package.json /src/
COPY bun.lock /src/

# Copy workspace packages
COPY packages /src/packages

# Copy all service package.json files (needed for workspace resolution)
COPY admin-service/package.json /src/admin-service/package.json
COPY auth-service/package.json /src/auth-service/package.json
COPY chat-service/package.json /src/chat-service/package.json
COPY core-service/package.json /src/core-service/package.json
COPY media-service/package.json /src/media-service/package.json
COPY payment-service/package.json /src/payment-service/package.json

# Install dependencies from root (this will resolve workspace dependencies)
RUN bun install

# Generate Prisma client
RUN bunx prisma generate --schema /src/packages/shared/prisma/schema.prisma

# Copy the specific service code
COPY media-service /src/media-service

# Set working directory to service
WORKDIR /src/media-service

CMD ["bun", "run", "dev"]
