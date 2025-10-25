# SHIELD.js Build System
# AI-Powered Client-Side Web Application Firewall

.PHONY: help build test lint clean docs release install dev dist

# Default target
help:
	@echo "SHIELD.js Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  build     - Build production distribution"
	@echo "  test      - Run test suite"
	@echo "  lint      - Run ESLint"
	@echo "  clean     - Clean build artifacts"
	@echo "  docs      - Generate documentation"
	@echo "  release   - Full release build (clean + test + lint + build + docs)"
	@echo "  install   - Install dependencies"
	@echo "  dev       - Start development build with watch mode"
	@echo "  dist      - Create distribution package"
	@echo ""

# Build targets
build:
	@echo "Building SHIELD.js..."
	@npm run build

test:
	@echo "Running tests..."
	@npm test

test-coverage:
	@echo "Running tests with coverage..."
	@npm run test:coverage

lint:
	@echo "Running linter..."
	@npm run lint

lint-fix:
	@echo "Fixing linting issues..."
	@npm run lint:fix

clean:
	@echo "Cleaning build artifacts..."
	@npm run clean

docs:
	@echo "Generating documentation..."
	@npm run docs

# Development targets
dev:
	@echo "Starting development mode..."
	@npm run dev

install:
	@echo "Installing dependencies..."
	@npm install

# Release targets
release:
	@echo "Creating release build..."
	@npm run release

dist:
	@echo "Creating distribution..."
	@npm run dist

# Utility targets
check: lint test
	@echo "All checks passed"

all: clean check build docs
	@echo "All tasks completed successfully"

# Version management
version-patch:
	@npm version patch

version-minor:
	@npm version minor

version-major:
	@npm version major

# Publish targets (use with caution)
publish-dry-run: build
	@npm publish --dry-run ./dist

publish: build
	@echo "Publishing to npm..."
	@npm publish ./dist