# Contributing to Honeybadger Courier Platform

Thank you for your interest in contributing!

## Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Code Style

- Use TypeScript with strict mode
- Follow Next.js App Router patterns
- Write meaningful commit messages
- Update documentation as needed

## Testing

- Write tests for new features
- Ensure all tests pass
- Maintain code coverage
- Test on multiple browsers and devices

## Commit Message Format

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Scope Examples:**
- `customer-web`, `agent-web`, `admin-panel` - specific app
- `db`, `shared`, `ui` - packages
- `api`, `auth`, `payment` - functionality area

**Example:**
```
feat(customer-web): Add price calculator by destination

Implement pricing logic that calculates India Post rates + margin based on
weight and destination country.

Closes #123
```

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new functionality
4. Include screenshots for UI changes
5. Reference related issues
6. Wait for code review

## Questions?

Open an issue or reach out to the team.

Happy coding! 🚀