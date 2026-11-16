# Contributing to Courier Booking Platform

Thank you for your interest in contributing to the Courier Booking Platform! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/courier-booking-platform.git`
3. Install dependencies: `npm install`
4. Set up environment variables: Copy `.env.local.example` to `.env.local` and fill in your credentials
5. Run the project: `npx nx dev:all`

## Development Workflow

1. Create a branch from `main`: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npx nx test`
4. Run lint: `npx nx lint`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Code Standards

- Use TypeScript for all code
- Follow the existing code style
- Write tests for new features
- Update documentation as needed

## Pull Request Process

1. Update the README.md with details of changes to the interface
2. Update the CHANGELOG.md with details of changes
3. The PR will be merged once you have the sign-off of at least one maintainer

## Questions?

Open an issue on GitHub!