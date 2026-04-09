# SDS - Smart Driving School Management System

AI-augmented driving school management platform for Vietnamese regulations.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Ant Design 5.x
- **Backend:** Node.js 20 LTS + Express 4.x
- **Database:** PostgreSQL 15
- **Auth:** JWT + bcrypt
- **AI:** Time-series forecasting, content-based filtering

## Quick Start
```bash
# Database
createdb sds_dev
cd database && npx knex migrate:latest && npx knex seed:run

# Backend
cd server && npm install && npm run dev

# Frontend
cd client && npm install && npm start
```

## Team
| Member | Role |
|--------|------|
| Minh | Tech Lead / BE Architect |
| Thien | Frontend Developer |
| Thanh | Business Analyst |
| Thang | QA Engineer |

## Links
- [Jira Board](https://swm501-thang.atlassian.net/jira/software/projects/SDS/boards/1)
- [Confluence](https://swm501-thang.atlassian.net/wiki/spaces/SDS/overview)
