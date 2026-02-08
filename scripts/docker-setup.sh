#!/bin/bash

# Docker Setup Script for OMT Tournament Management System

echo "🏆 OMT Tournament Management System - Docker Setup"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create uploads directory if it doesn't exist
mkdir -p public/uploads
echo "✅ Created uploads directory"

# Copy environment file if it doesn't exist
if [ ! -f .env.production ]; then
    cp .env.docker .env.production
    echo "✅ Created .env.production from template"
    echo "⚠️  Please edit .env.production with your production settings"
fi

echo ""
echo "🚀 Available Commands:"
echo "  Production:  docker-compose up -d"
echo "  Development: docker-compose -f docker-compose.dev.yml up -d"
echo "  Stop:        docker-compose down"
echo "  Logs:        docker-compose logs -f"
echo ""

# Ask user what they want to do
read -p "Do you want to start the production environment now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting production environment..."
    docker-compose up -d
    echo ""
    echo "✅ Application is starting up!"
    echo "🌐 Visit: http://localhost:3000"
    echo "📊 Database: localhost:5432"
    echo ""
    echo "📝 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
else
    echo "👍 Setup complete! Use the commands above to start when ready."
fi