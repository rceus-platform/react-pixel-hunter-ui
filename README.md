# React Pixel Hunter UI

[![React 18](https://img.shields.io/badge/React-18.3+-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6.svg)](https://www.typescriptlang.org/)

## Overview

The **React Pixel Hunter UI** is a modern, responsive frontend application for the Pixel Hunter ecosystem. It provides users with a seamless interface to search, browse, and manage high-definition images retrieved via the [Pixel Hunter API](https://github.com/rceus-platform/python-pixel-hunter-api).

Built with **React 18** and **Vite**, the application prioritizes speed, developer experience, and maintainability.

## Key Features

- **High-Performance UI**: Fast rendering and optimized builds powered by Vite.
- **Robust State Management**: Predictable API interactions using Axios and React hooks.
- **Type-Safe Architecture**: Fully developed in TypeScript to catch errors at compile-time and improve IDE autocomplete.
- **Extensible Design**: Modular component structure ready for upcoming features (e.g., advanced sorting, filtering).

## Tech Stack

- **Frontend Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite 5](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Testing**: [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/)

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd react-pixel-hunter-ui/application-source
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Configuration

Create a `.env` file in the `application-source` directory (do not commit this file).

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Testing

Run the test suite using Vitest:

```bash
npm test
```

For type-checking without emitting files:

```bash
npm run type-check
```

## Upcoming Features

- **Advanced Sorting**: Implement a "Sort BY" functionality to organize image search results (e.g., by resolution, date, relevance).

## License

This project is licensed under MIT License.
