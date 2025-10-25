# Development Guide

This guide covers everything you need to know to contribute to Core Developer, from setting up your development environment to running tests and submitting pull requests.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/shield-js.git
cd shield-js
```

### 2. Install Dependencies

```bash
npm install
```

This will install all necessary dependencies for development, testing, and building.

### 3. Development Workflow

#### Starting the Development Server

For documentation development:

```bash
npm run docs:dev
```

This starts the VitePress development server at `http://localhost:5173`.

#### Building for Production

```bash
# Build the library
npm run build

# Build the documentation
npm run docs:build
```

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Code Quality Checks

```bash
# Lint the code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Type checking
npm run type-check
```

## Project Structure

```
shield-js/
├── src/                    # Source code
│   ├── core/              # Core protection logic
│   ├── detectors/         # Threat detection modules
│   ├── interceptors/      # Request/response interceptors
│   ├── storage/           # IndexedDB storage layer
│   └── utils/             # Utility functions
├── docs/                  # Documentation
│   ├── .vitepress/       # VitePress configuration
│   └── ...               # Documentation pages
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── dist/                 # Built distribution files
├── package.json          # Project configuration
├── rollup.config.js      # Build configuration
├── jest.config.js        # Test configuration
└── eslint.config.js      # Linting configuration
```

## Development Guidelines

### Code Style

We use ESLint and Prettier to maintain consistent code style. The configuration is defined in:

- `eslint.config.js` - ESLint rules
- `.prettierrc` - Prettier formatting rules

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

### Branch Naming

Use descriptive branch names:

```
feature/add-threat-detection
fix/cors-issue
docs/update-api-reference
```

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a pull request with a clear description

## Testing Strategy

### Unit Tests

Unit tests focus on individual functions and modules. Place them in `tests/unit/` with the pattern `*.test.js`.

### Integration Tests

Integration tests verify that different modules work together correctly. Place them in `tests/integration/`.

### End-to-End Tests

E2E tests simulate real user scenarios. Place them in `tests/e2e/`.

### Writing Tests

```javascript
import { ShieldFirewall } from '../src/index.js';

describe('ShieldFirewall', () => {
  let shield;

  beforeEach(() => {
    shield = new ShieldFirewall();
  });

  test('should initialize with default config', () => {
    expect(shield.config).toBeDefined();
  });

  test('should detect XSS attacks', () => {
    const maliciousScript = '<script>alert("xss")</script>';
    const result = shield.detectThreat(maliciousScript);
    expect(result.isThreat).toBe(true);
  });
});
```

## Building and Releasing

### Version Management

We use semantic versioning (semver). Version bumps are automated via GitHub Actions.

### Release Process

1. Create a release branch: `git checkout -b release/v1.2.3`
2. Update version in `package.json`
3. Update changelog
4. Create pull request
5. Merge to main (triggers release workflow)
6. GitHub Actions publishes to NPM

### Distribution Files

The build process generates multiple distribution formats:

- `dist/shield.js` - UMD bundle for browsers
- `dist/shield.min.js` - Minified UMD bundle
- `dist/shield.esm.js` - ES module bundle
- `dist/shield.cjs.js` - CommonJS bundle

## Debugging

### Browser Developer Tools

Use browser dev tools to inspect:

- Network tab: Monitor intercepted requests
- Console: View threat detection logs
- Application tab: Inspect IndexedDB storage

### Debug Mode

Enable debug logging:

```javascript
const shield = new ShieldFirewall({
  debug: true
});
```

### Common Issues

**Build fails with "Module not found"**
- Ensure all dependencies are installed: `npm install`
- Check Node.js version compatibility

**Tests fail intermittently**
- Clear test cache: `npm run test:clear`
- Run tests sequentially: `npm run test -- --runInBand`

**Documentation doesn't update**
- Restart dev server: `npm run docs:dev`
- Clear cache: `rm -rf docs/.vitepress/cache`

## Contributing

We welcome contributions! Please see our [Contributing Guide](../community/contributing.md) for detailed information.

### First Time Contributors

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Run tests and linting
6. Submit a pull request

### Areas for Contribution

- **Core Features**: Enhance threat detection algorithms
- **Documentation**: Improve guides and examples
- **Testing**: Add more test coverage
- **Performance**: Optimize detection speed
- **Browser Support**: Extend compatibility

## Getting Help

- **Issues**: Report bugs or request features on GitHub
- **Discussions**: Ask questions in GitHub Discussions
- **Discord**: Join our community chat

Thank you for contributing to Core Developer!