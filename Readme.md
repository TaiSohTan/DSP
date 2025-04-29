# Digital Systems Project (DSP)

## Overview
The Digital Systems Project (DSP) is a blockchain-based electronic voting system designed to ensure secure, transparent, and tamper-proof elections. This project integrates modern web technologies, blockchain, and backend services to provide a robust platform for election management and voting.

## Features
- **Admin Dashboard**: Manage users, elections, and system settings.
- **Blockchain Integration**: Immutable voting records using Ethereum/Ganache.
- **User Management**: Verify and manage user accounts.
- **Election Management**: Create, monitor, and deploy elections.
- **Real-Time System Monitoring**: Check system and blockchain health.
- **Responsive Design**: Optimized for various devices.

## Technologies Used
- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Django, Django REST Framework
- **Blockchain**: Ethereum, Ganache
- **Containerization**: Docker, Docker Compose
- **Database**: PostgreSQL

## Prerequisites
- Node.js (v16 or later)
- Python (v3.10 or later)
- Docker and Docker Compose
- Ganache (for local blockchain development)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DSP
```

### 2. Install Dependencies
#### Frontend
```bash
cd frontend-vite
npm install
```
#### Backend
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and configure the following variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Django secret key
- `GANACHE_URL`: URL for the Ganache blockchain

### 4. Run the Application
#### Using Docker Compose
```bash
docker-compose up --build
```
#### Manually
- Start the backend:
  ```bash
  python manage.py runserver
  ```
- Start the frontend:
  ```bash
  cd frontend-vite
  npm run dev
  ```

### 5. Access the Application
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

## Project Structure
```
DSP/
├── api/                # Backend API logic
├── blockchain/         # Blockchain-related services
├── dsp/                # Django project settings
├── frontend-vite/      # Frontend application
├── verification/       # User verification services
├── docker-compose.yaml # Docker Compose configuration
├── manage.py           # Django management script
└── requirements.txt    # Backend dependencies
```

## Testing
- Run backend tests:
  ```bash
  python manage.py test
  ```
- Run frontend tests:
  ```bash
  cd frontend-vite
  npm test
  ```

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments
- UWE Bristol for project guidance
- Open-source libraries and tools used in this project