# Lude Admin Panel

This is the admin panel for the Lude application, designed to provide administrative controls and analytics for the Lude tracking platform.

## Features

- **User Management**: View, search, and manage user accounts
- **Track Management**: Monitor, filter, and delete user tracks
- **Vehicle Management**: View and manage vehicle information
- **Analytics Dashboard**: Visualize app usage, user growth, and activity patterns
- **API Tester**: Test and debug API endpoints directly from the admin interface

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project (for authentication)

### Installation

1. Clone the repository:
```
git clone <repository-url>
```

2. Navigate to the admin directory:
```
cd lude/apps/admin
```

3. Install dependencies:
```
npm install
```

4. Set up environment variables:
   - Copy `.env.example` to a new file named `.env` at the root of the admin directory
   - Fill in your Firebase configuration details and other environment variables
   ```
   cp .env.example .env
   ```

5. Start the development server:
```
npm run dev
```

6. Open your browser and navigate to http://localhost:3002

## Environment Variables

The admin panel uses the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | URL of the Lude backend API | Yes |
| VITE_FIREBASE_API_KEY | Firebase API Key | Yes |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase Auth Domain | Yes |
| VITE_FIREBASE_PROJECT_ID | Firebase Project ID | Yes |
| VITE_FIREBASE_STORAGE_BUCKET | Firebase Storage Bucket | Yes |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Firebase Messaging Sender ID | Yes |
| VITE_FIREBASE_APP_ID | Firebase App ID | Yes |
| VITE_ADMIN_EMAIL | Email(s) allowed to access admin panel | Yes |

## Authentication

This application uses Firebase Authentication. You need to:

1. Create an admin user in your Firebase project
2. Add the admin user's email to the VITE_ADMIN_EMAIL environment variable
3. Login with the admin user's credentials

## API Configuration

The application connects to the Lude backend API. The API URL can be configured in the `.env` file.

## Development Notes

- All data is now fetched from the actual backend API
- Authentication is handled through Firebase
- API requests are automatically authenticated with the Firebase ID token

## License

This project is licensed under the MIT License - see the LICENSE file for details. 