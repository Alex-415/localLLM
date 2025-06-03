# KML Production - Private LLM Chat Application

A secure, private chat application that leverages the OpenRouter API to provide AI-powered conversations while maintaining user privacy and data security.

## 🚀 Features

- 🔐 Secure Firebase Authentication
- 💬 Real-time chat interface with AI
- 🎨 Modern, responsive UI
- 🔒 Private message handling
- 🌐 Cross-origin resource sharing (CORS) support
- 🚦 Error handling and logging
- 📱 Mobile-friendly design

## 🛠️ Technologies Used

### Frontend
- **React** - UI library for building the user interface
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend tooling
- **Firebase** - Authentication and user management
- **CSS Modules** - Scoped styling

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **OpenRouter API** - AI chat completions
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Deployment
- **Render.com** - Cloud platform for hosting
- **GitHub** - Version control and CI/CD

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- OpenRouter API key

## 🔒 Security Setup

1. Create a `.env` file in the root directory
2. Never commit the `.env` file to version control
3. Keep your API keys and secrets secure
4. Use environment variables for all sensitive data

Required environment variables:
- Firebase configuration variables
- OpenRouter API key
- Server configuration

For detailed setup instructions, please contact the project maintainer.

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Alex-415/localLLM.git
   cd localLLM
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Contact the project maintainer for the required environment variables
   - Create a `.env` file with the provided variables
   - Never share or expose your API keys

4. Start the development server:
   ```bash
   npm run dev
   ```

5. In a separate terminal, start the backend server:
   ```bash
   cd server
   npm install
   npm start
   ```

## 🏗️ Project Structure

```
localLLM/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── styles/         # CSS styles
│   └── App.tsx         # Main application component
├── server/
│   └── index.mjs       # Express server
├── public/             # Static files
└── vite.config.ts      # Vite configuration
```

## 🔒 Security Features

- Firebase Authentication for secure user management
- Environment variable protection
- CORS configuration for secure cross-origin requests
- API key protection
- Secure headers configuration
- No sensitive data in version control

## 🌐 API Endpoints

- `POST /api/chat` - Chat completion endpoint
- `GET /health` - Health check endpoint

## 🚀 Deployment

The application is deployed on Render.com with automatic deployments from the master branch.

### Deployment Security
- Environment variables are configured in Render.com dashboard
- API keys are never exposed in the codebase
- CORS is configured for specific origins only

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Security Guidelines for Contributors
- Never commit API keys or sensitive data
- Use environment variables for all secrets
- Follow security best practices
- Report security vulnerabilities privately

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Alex** - *Initial work* - [Alex-415](https://github.com/Alex-415)

## 🙏 Acknowledgments

- OpenRouter API for AI capabilities
- Firebase for authentication
- Render.com for hosting
- The React and Express communities
