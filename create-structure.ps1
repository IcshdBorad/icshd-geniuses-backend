# ICSHD GENIUSES Project Structure Creation Script

# Backend Structure
New-Item -ItemType Directory -Path "backend\controllers" -Force
New-Item -ItemType Directory -Path "backend\models" -Force
New-Item -ItemType Directory -Path "backend\routes" -Force
New-Item -ItemType Directory -Path "backend\middleware" -Force
New-Item -ItemType Directory -Path "backend\utils" -Force
New-Item -ItemType Directory -Path "backend\generators" -Force
New-Item -ItemType Directory -Path "backend\assessment" -Force
New-Item -ItemType Directory -Path "backend\adaptive" -Force
New-Item -ItemType Directory -Path "backend\admin" -Force
New-Item -ItemType Directory -Path "backend\database" -Force
New-Item -ItemType Directory -Path "backend\tests" -Force

# Frontend Structure
New-Item -ItemType Directory -Path "frontend\src" -Force
New-Item -ItemType Directory -Path "frontend\src\components" -Force
New-Item -ItemType Directory -Path "frontend\src\pages" -Force
New-Item -ItemType Directory -Path "frontend\src\services" -Force
New-Item -ItemType Directory -Path "frontend\src\store" -Force
New-Item -ItemType Directory -Path "frontend\src\utils" -Force
New-Item -ItemType Directory -Path "frontend\src\assets" -Force
New-Item -ItemType Directory -Path "frontend\src\assets\css" -Force
New-Item -ItemType Directory -Path "frontend\src\assets\js" -Force
New-Item -ItemType Directory -Path "frontend\src\assets\images" -Force
New-Item -ItemType Directory -Path "frontend\src\assets\audio" -Force
New-Item -ItemType Directory -Path "frontend\public" -Force

# WordPress Plugin Structure
New-Item -ItemType Directory -Path "wordpress-plugin\includes" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\includes\generators" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\includes\assessment" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\includes\adaptive" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\includes\admin" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\includes\public" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\includes\shortcodes" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\includes\helpers" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\includes\database" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\assets" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\assets\css" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\assets\js" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\assets\images" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\assets\audio" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\templates" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\templates\admin" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\templates\public" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\templates\shortcodes" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\languages" -Force
New-Item -ItemType Directory -Path "wordpress-plugin\tests" -Force

# Documentation and Config
New-Item -ItemType Directory -Path "docs" -Force
New-Item -ItemType Directory -Path "config" -Force

Write-Host "Project structure created successfully!" -ForegroundColor Green
