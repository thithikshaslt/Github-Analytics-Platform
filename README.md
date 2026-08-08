# GitHub Analytics Platform

A modern, high-performance web application built on a microservices architecture to ingest, analyze, and visualize GitHub user data, repository statistics, commits, and pull requests. This project applies state-of-the-art software engineering patterns to ensure separation of concerns, scalability, and robust observability.

---

## System Architecture

The platform is designed using a Microservices Architecture with an API Gateway as the single entry point. The backend is split into domain-specific microservices that logically separate data concerns, while the frontend communicates through the API Gateway.

---

## Features

- **GitHub Username Ingestion**: Enter any GitHub username to initiate user mapping.
- **User Profile Cache**: Safely caches GitHub profiles internally to optimize external API rate limits.
- **Commits Dashboard**: Visualizes commit frequency over time with responsive month-by-month line charts using Chart.js.
- **Pull Requests Sync**: Tracks pull request quantities and states (Open, Closed, Merged).
- **Leaderboards & Analytics**: Segment and inspect the user's top 3 repositories by:
  - **Stars Count**
  - **Forks Count**
  - **Commit Activity**
  - **PR Activity**
  - **Recently Updated**
- **Observability**: Exposes real-time application metrics at `/metrics` across services using Prometheus client integration.

---

## Tech Stack

### Frontend
- **Framework**: React 19 (Vite SPA)
- **Styling**: CSS & Tailwind CSS (v4) with Tailwind-merge & clsx
- **Routing**: React Router DOM (v7)
- **Visualizations**: Chart.js & React-chartjs-2
- **Icons**: Lucide React

### Backend (Microservices)
- **Runtime**: Node.js & Express
- **Database**: MongoDB (configured via Mongoose ODM)
- **Http Proxying**: HTTP Proxy Middleware (`http-proxy-middleware`)
- **Metrics/Telemetry**: Prom-client (Prometheus format)
- **HTTP Client**: Axios

---

## Software Patterns Applied

### 1. API Gateway Pattern
Instead of exposing individual microservice URLs and ports to the React frontend, all request routing flows through a single API Gateway on Port `5000`. The gateway is responsible for:
- Routing requests to the corresponding downstream service.
- Performing path rewrites (e.g., rewriting `/users/foo` to `/users/users/foo` or `/repos/foo` to `/repos/repos/foo` where necessary).
- Serving as a central metrics collection point.

### 2. Database Per Service (Logical Isolation)
Each microservice is built to manage its own isolated data domain. Downstream services interact with their specific MongoDB collection boundaries (Users, Repositories, Commits, and Pull Requests). Data separation prevents services from querying each other's databases directly, reducing architectural coupling.

### 3. Data Ingestion & Synchronization Pipeline
The `github-service` acts as an ingestion coordinator. Rather than requiring each service to talk to the external GitHub API:
1. The client requests sync tasks (commits, pull requests).
2. The `github-service` queries the external GitHub API using credentials.
3. The retrieved payload is mapped and dispatched to the internal REST API endpoints of respective domain microservices (`user-service`, `repository-service`, etc.) to update MongoDB.

### 4. Observability and Monitoring
Services use `prom-client` to gather CPU, memory, garbage collection, and custom HTTP request counters. Each service exposes a `/metrics` route that can be scraped directly by Prometheus to monitor backend stability and API health.

---

## Microservices Directory & Endpoint Map

| Microservice | Directory Path | Port | MongoDB Collection / Purpose | Routes / Key Endpoints |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | [api-gateway](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/api-gateway) | `5000` | Gateway & Reverse Proxy | Routing downstream, `/metrics` |
| **GitHub Ingestion** | [github-service](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/services/github-service) | `5001` | Data Fetching & Sync Coordinator | `/users/:username`, `/repos/:username`, `/commits/:owner/:repo`, `/pulls/:owner/:repo` |
| **User Service** | [user-service](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/services/user-service) | `5002` | `users` collection | `GET /users/:username`, `POST /users`, `GET /users` |
| **Repository Service**| [repository-service](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/services/repository-service) | `5003` | `repositories` collection | `GET /repos/:username` (syncs too), `POST /repos`, `GET /repos` |
| **Commit Service** | [commit-service](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/services/commit-service) | `5004` | `commits` collection | `POST /sync/:username`, `GET /:username`, `GET /:username/total` |
| **PR Service** | [pull-request-service](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/services/pull-request-service) | `5005` | `pullrequests` collection | `POST /sync/:username`, `GET /:username`, `GET /:username/total` |

---

## Configuration (Environment Variables)

To run the application, you must provide `.env` configuration files in the root of the respective service directories.

### GitHub Ingestion Service Configuration
Create [backend/services/github-service/.env](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/services/github-service/.env):
```env
PORT=5001
GITHUB_API_URL=https://api.github.com
# Use PAT Token
GITHUB_TOKEN=your_personal_access_token
# OR Github App Credentials (optional / fallback authentication)
GITHUB_APP_ID=your_github_app_id
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_PRIVATE_KEY_PATH=D:\absolute\path\to\your\private-key.pem
GITHUB_INSTALLATION_ID=your_github_app_installation_id
```

### User Service Configuration
Create [backend/services/user-service/.env](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/services/user-service/.env):
```env
PORT=5002
MONGO_URI=your_mongodb_connection_string
GITHUB_TOKEN=your_personal_access_token # Fallback token for user fetching
```

### Repository Service Configuration
Create [backend/services/repository-service/.env](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/services/repository-service/.env):
```env
PORT=5003
MONGO_URI=your_mongodb_connection_string
GITHUB_TOKEN=your_personal_access_token # Fallback token
```

### Commit Service Configuration
Create [backend/services/commit-service/.env](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/services/commit-service/.env):
```env
PORT=5004
MONGO_URI=your_mongodb_connection_string
GITHUB_TOKEN=your_personal_access_token # Sync auth token
```

### PR Service Configuration
Create [backend/services/pull-request-service/.env](file:///d:/Sem%206/20XW68/Github-Analytics-Platform/backend/services/pull-request-service/.env):
```env
PORT=5005
MONGO_URI=your_mongodb_connection_string
GITHUB_TOKEN=your_personal_access_token # Sync auth token
```

---

## Setup & Execution Guide

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB Atlas Connection** or a local running instance of **MongoDB**

### 1. Installation
Install project-wide dependencies for the backend and frontend:

#### Root and General Backend Setup
```bash
cd backend
npm install
```

#### Install dependencies for each microservice
```bash
cd services/user-service && npm install
cd ../repository-service && npm install
cd ../commit-service && npm install
cd ../pull-request-service && npm install
cd ../github-service && npm install
```

#### Frontend Setup
```bash
cd ../../../frontend
npm install
```

---

### 2. Starting the Platform

To run the full platform locally, you need to spin up each of the backend services, the API gateway, and the frontend server.

#### Running Backend Services & API Gateway
Open separate terminal windows and start each service:

1. **API Gateway**:
   ```bash
   cd backend/api-gateway
   node index.js
   ```
2. **GitHub Ingestion Service**:
   ```bash
   cd backend/services/github-service
   node index.js
   ```
3. **User Service**:
   ```bash
   cd backend/services/user-service
   node index.js
   ```
4. **Repository Service**:
   ```bash
   cd backend/services/repository-service
   node index.js
   ```
5. **Commit Service**:
   ```bash
   cd backend/services/commit-service
   node index.js
   ```
6. **PR Service**:
   ```bash
   cd backend/services/pull-request-service
   node index.js
   ```

#### Running the Frontend Client
In a new terminal window:
```bash
cd frontend
npm run dev
```

Visit the dashboard at [http://localhost:5173](http://localhost:5173) to enter a GitHub username and explore metrics!
