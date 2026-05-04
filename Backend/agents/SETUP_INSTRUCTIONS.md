# HealthMap Backend - Laravel Project Setup

## Project Information
- **Project Name**: HealthMap Backend
- **Framework**: Laravel 13.5.0
- **PHP Version**: 8.3.30
- **Location**: `c:\Users\ZaidS\HealthMap Backend\HealthMap-backend`
- **Package Manager**: Composer

## Environment Setup

### Installed Tools
- **Laragon 8.6.1** - Complete development environment
  - Location: `C:\Laragon`
  - Includes: PHP, MySQL, Apache/Nginx, Git, and more

### PHP Setup
- **PHP Path**: `C:\Laragon\bin\php\php-8.3.30-Win32-vs16-x64`
- **Composer Path**: `C:\Laragon\bin\composer`

## Running the Project

### Using Laragon CLI with PHP
```powershell
# Navigate to project directory
cd "c:\Users\ZaidS\HealthMap Backend\HealthMap-backend"

# Run artisan commands
$php = "C:\Laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe"
& $php artisan migrate
& $php artisan serve
```

### Using Composer
```powershell
# Install dependencies
$composer = "C:\Laragon\bin\composer\composer.bat"
& $composer install

# Update dependencies
& $composer update
```

## Project Structure
```
HealthMap-backend/
├── app/                 # Application logic
│   ├── Http/
│   │   ├── Controllers/
│   │   └── Middleware/
│   ├── Models/
│   └── ...
├── bootstrap/           # Framework bootstrap
├── config/             # Configuration files
├── database/           # Database migrations and factories
│   ├── migrations/
│   └── seeders/
├── public/             # Publicly accessible files
├── resources/          # Views and assets
│   ├── css/
│   ├── js/
│   └── views/
├── routes/             # Route definitions
│   ├── api.php
│   ├── web.php
│   └── ...
├── storage/            # Application storage
├── tests/              # Test files
├── vendor/             # Composer dependencies
├── .env                # Environment configuration
├── .env.example        # Example environment file
├── artisan             # Laravel CLI
├── composer.json       # Composer configuration
└── composer.lock       # Composer lock file
```

## Initial Configuration

### Set Application Key
```powershell
$php = "C:\Laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe"
& $php artisan key:generate
```

### Database Setup
1. Update `.env` with your database credentials
2. Run migrations: `$php artisan migrate`

## Available Commands

```powershell
$php = "C:\Laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe"

# Display help
& $php artisan

# List all commands
& $php artisan list

# Run development server
& $php artisan serve

# Create a new controller
& $php artisan make:controller YourControllerName

# Create a new model
& $php artisan make:model YourModelName

# Run migrations
& $php artisan migrate

# Run tests
& $php artisan test
```

## Notes
- All dependencies have been installed via Composer
- The project is ready for development
- You can use Laragon's GUI to manage services (Apache, MySQL, etc.)
- For production, additional configuration would be required

## Troubleshooting

### PHP Warnings
Some PHP extensions may show warnings. These don't affect functionality but can be resolved by updating `php.ini` in the PHP directory.

### Running Artisan
If artisan commands fail, ensure you're using the full PHP path from Laragon or add it to your system PATH.

---
**Created**: April 18, 2026
**Status**: Ready for Development ✓
