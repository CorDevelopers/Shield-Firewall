# Contributing to SHIELD.js

Thank you for your interest in contributing to SHIELD.js! We welcome contributions from the community.

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## How to Contribute

### Reporting Bugs
- Use the bug report template when creating issues
- Include detailed steps to reproduce
- Provide browser, OS, and SHIELD.js version information
- Include console errors and network requests if relevant

### Suggesting Features
- Use the feature request template
- Clearly describe the problem and proposed solution
- Provide use cases and implementation ideas

### Contributing Code

1. **Fork the repository** and create a feature branch
2. **Set up development environment**:
   ```bash
   npm install
   npm run build
   ```
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Run the test suite**:
   ```bash
   npm test
   npm run lint
   ```
6. **Update documentation** if needed
7. **Submit a pull request** with a clear description

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/shield-js.git
cd shield-js

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Coding Standards

- Use ESLint configuration for code style
- Write meaningful commit messages
- Add JSDoc comments for public APIs
- Follow semantic versioning
- Keep the bundle size minimal

### Testing

- Write unit tests for new features
- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Include integration tests for complex features
- Test security features thoroughly

### Documentation

- Update README.md for API changes
- Add examples for new features
- Update JSDoc comments
- Keep documentation in sync with code

## Pull Request Process

1. Ensure your code follows our coding standards
2. Update tests and documentation
3. Ensure CI passes
4. Request review from maintainers
5. Address review feedback
6. Merge when approved

## Security Considerations

SHIELD.js is a security-focused library. When contributing:

- Be mindful of security implications
- Test thoroughly for bypasses
- Report security issues privately
- Follow responsible disclosure practices

## License

By contributing to SHIELD.js, you agree that your contributions will be licensed under the same license as the project (MIT).

## Recognition

Contributors will be recognized in our README and release notes. Thank you for helping make SHIELD.js better!