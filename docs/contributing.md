# Contributing to Core Developer

Thank you for your interest in contributing to Core Developer! We welcome contributions from developers of all skill levels. This guide will help you get started with contributing to the project.

## Ways to Contribute

### Code Contributions

- **Bug Fixes**: Fix issues reported in our [GitHub Issues](https://github.com/your-org/shield-js/issues)
- **New Features**: Implement new threat detection capabilities or performance improvements
- **Documentation**: Improve documentation, add examples, or fix typos
- **Tests**: Add test coverage for existing or new functionality

### Non-Code Contributions

- **Bug Reports**: Report bugs with detailed reproduction steps
- **Feature Requests**: Suggest new features or improvements
- **Documentation**: Help improve our documentation
- **Community Support**: Help other users in discussions and issues

## Development Setup

Before you start contributing, please set up your development environment. See our [Development Guide](./development.md) for detailed instructions.

## Contribution Process

### 1. Choose an Issue

- Check our [GitHub Issues](https://github.com/your-org/shield-js/issues) for open tasks
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/yourusername/shield-js.git
cd shield-js

# Add upstream remote
git remote add upstream https://github.com/your-org/shield-js.git
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-number-description
```

### 4. Make Changes

- Write clear, concise commit messages
- Follow our coding standards
- Add tests for new functionality
- Update documentation as needed

### 5. Test Your Changes

```bash
# Run the test suite
npm test

# Run linting
npm run lint

# Build the project
npm run build
```

### 6. Submit a Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Create a pull request on GitHub
```

## Pull Request Guidelines

### PR Title

Use a clear, descriptive title that follows conventional commit format:

```
feat: add support for custom threat patterns
fix: resolve XSS detection false positive
docs: update API reference for new methods
```

### PR Description

Include:

- **What** changes were made
- **Why** the changes were needed
- **How** to test the changes
- Screenshots or examples if applicable
- Links to related issues

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Code is linted (`npm run lint`)
- [ ] Documentation is updated
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains the changes

## Code Style Guidelines

### JavaScript/TypeScript

- Use ES6+ features
- Use `const` and `let` instead of `var`
- Use arrow functions when appropriate
- Use template literals for string interpolation
- Use async/await for asynchronous code

### Naming Conventions

- **Variables**: camelCase (`userInput`, `threatLevel`)
- **Functions**: camelCase (`detectThreat`, `validateConfig`)
- **Classes**: PascalCase (`ShieldFirewall`, `ThreatDetector`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)

### Code Structure

```javascript
// Good: Clear function with JSDoc
/**
 * Detects potential XSS threats in user input
 * @param {string} input - The input to analyze
 * @returns {boolean} True if threat detected
 */
function detectXSS(input) {
  // Implementation
}

// Avoid: Complex nested functions
function processData(data) {
  return data.map(item => {
    if (item.type === 'threat') {
      return item.details.filter(detail => {
        return detail.level > 5;
      });
    }
  });
}
```

## Testing Guidelines

### Unit Tests

- Test individual functions and methods
- Use descriptive test names
- Cover both positive and negative cases
- Mock external dependencies

```javascript
describe('ThreatDetector', () => {
  test('should detect XSS in script tags', () => {
    const detector = new ThreatDetector();
    const result = detector.detect('<script>alert("xss")</script>');
    expect(result.isThreat).toBe(true);
  });

  test('should not flag safe HTML', () => {
    const detector = new ThreatDetector();
    const result = detector.detect('<p>Hello World</p>');
    expect(result.isThreat).toBe(false);
  });
});
```

### Integration Tests

- Test how components work together
- Test real browser environments when possible
- Verify end-to-end functionality

## Documentation

### Code Documentation

- Use JSDoc comments for all public APIs
- Document parameters, return values, and examples
- Keep comments up to date with code changes

### User Documentation

- Update guides when APIs change
- Add examples for new features
- Fix typos and improve clarity

## Security Considerations

When contributing security-related code:

- **Never** commit sensitive information
- **Always** validate input data
- **Test** thoroughly for edge cases
- **Document** security implications
- **Report** security issues privately

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: For real-time community support

## Recognition

Contributors are recognized in:

- GitHub's contributor insights
- Our changelog and release notes
- Community acknowledgments

## Code of Conduct

Please review our [Code of Conduct](./community/code-of-conduct.md) before contributing. We are committed to providing a welcoming and inclusive environment for all contributors.

Thank you for contributing to Core Developer! 🚀