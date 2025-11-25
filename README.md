# Simple Landing Page

A production-ready containerized landing page with automated CI/CD pipeline, built with Docker and deployed via GitHub Actions.

## 🚀 Features

- **Multi-stage Docker build** with nginx:alpine for minimal footprint (<100MB)
- **Security-first design** with non-root user execution (UID 1001)
- **Automated CI/CD pipeline** with GitHub Actions
- **Container health checks** for production reliability
- **Multi-architecture support** (linux/amd64, linux/arm64)
- **Automated security scanning** with Trivy
- **Preview deployments** for pull requests

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** >= 24.0.0
- **Docker Compose** >= 2.0.0
- **Git** for version control

### Verify Installation