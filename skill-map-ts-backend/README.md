# Skill Map TypeScript Backend

TypeScript backend for the skill mapping application that communicates with the Python AI microservice.

## Features

- Generate personalized skill maps
- Track progress on learning journeys
- Adapt skill maps based on context changes (travel, schedule adjustments, etc.)
- Store and retrieve skill maps from MongoDB

## Technology Stack

- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Axios for HTTP requests to Python microservice

## Setup and Installation

### Prerequisites

- Node.js (v14+)
- MongoDB
- Python microservice running (see skill-map-ai-service repository)

### Local Development

1. Clone the repository
```bash
git clone [repository-url]
cd skill-map-ts-backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory
```
PORT=8080
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/skill-map-db
PYTHON_SERVICE_URL=http://localhost:8000
```

4. Start the development server
```bash
npm run dev
```

### Docker Development

For development with Docker (includes MongoDB and connects to Python microservice):

```bash
docker-compose up
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Skill Maps

- `POST /api/skill-maps` - Generate a new skill map
- `GET /api/skill-maps/user/:userId` - Get all skill maps for a user
- `GET /api/skill-maps/:id` - Get a specific skill map by ID
- `PATCH /api/skill-maps/:skillMapId/progress` - Update progress on a skill map

## Example Usage

### Generate a skill map

```bash
curl -X POST http://localhost:8080/api/skill-maps \
  -H "Content-Type: application/json" \
  -d '{
    "userProfile": {
      "userId": "user123",
      "currentSkillLevel": "beginner",
      "learningStylePreferences": ["visual", "reading"],
      "timeAvailability": {
        "hoursPerWeek": 10
      }
    },
    "targetSkill": "web development",
    "timeFrame": 90
  }'
```

### Update progress

```bash
curl -X PATCH http://localhost:8080/api/skill-maps/[skill-map-id]/progress \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "progressUpdates": [
      {
        "nodeId": "node1",
        "completionPercentage": 75,
        "timeSpent": 5
      }
    ]
  }'
```