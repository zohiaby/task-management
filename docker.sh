#!/bin/bash

# Function to display usage
show_usage() {
    echo "Usage: ./docker.sh [command]"
    echo "Commands:"
    echo "  start       - Start the containers"
    echo "  stop        - Stop the containers"
    echo "  restart     - Restart the containers"
    echo "  logs        - Show container logs"
    echo "  status      - Show container status"
    echo "  clean       - Remove containers and volumes"
    echo "  help        - Show this help message"
}

# Function to start containers
start_containers() {
    echo "Starting containers..."
    docker-compose up -d
    echo "Containers started successfully!"
}

# Function to stop containers
stop_containers() {
    echo "Stopping containers..."
    docker-compose down
    echo "Containers stopped successfully!"
}

# Function to restart containers
restart_containers() {
    echo "Restarting containers..."
    docker-compose restart
    echo "Containers restarted successfully!"
}

# Function to show logs
show_logs() {
    docker-compose logs -f
}

# Function to show status
show_status() {
    echo "Container Status:"
    docker-compose ps
}

# Function to clean up
clean_up() {
    echo "Removing containers and volumes..."
    docker-compose down -v
    echo "Containers and volumes removed successfully!"
}

# Main script logic
case "$1" in
    "start")
        start_containers
        ;;
    "stop")
        stop_containers
        ;;
    "restart")
        restart_containers
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_up
        ;;
    "help"|"")
        show_usage
        ;;
    *)
        echo "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac 