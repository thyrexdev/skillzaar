## Frontend

This project uses Next.js for the frontend. It includes:

- **Routing**: Implemented using Next.js Pages.
- **State Management**: Utilizes Zustand for managing authentication state.
- **UI Components**: Built with Radix-UI and Tailwind CSS for styling.
- **Forms**: Uses React Hook Form with Zod validation for the registration and login pages.
- **Auth Logic**: Mock authentication logic is used to simulate login and registration processes.

### Key Components:
- `LoginPage` & `RegisterPage`: Provide authentication forms.
- `Dashboard`: Displays a summary of the user's projects and activities.

## Backend
The backend is set up with Express.js, handling HTTP requests and routes.

- **Server**: Express server is configured to handle API requests.
- **Middleware**: Includes CORS, cookie-parser, and dotenv for environment variables.
- **Routing**: Basic routing configured in `src/routes/index.ts`.

### Environment Variables:
- `DATABASE_URL`: Connection string for the PostgreSQL database.
- `PORT`: Port number for running the server locally.

## Running the Project

To start the development server, run the following commands for both frontend and backend:

```bash
# Frontend
cd client
npm run dev

# Backend
cd server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the frontend.
Check the backend by accessing its corresponding API routes.


