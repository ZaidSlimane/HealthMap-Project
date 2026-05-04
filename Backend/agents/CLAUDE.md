# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands
- Setup project: `composer install` followed by `php artisan key:generate` and `php artisan migrate`
- Run development server: `composer dev` (runs server, queue, logs, and vite concurrently)
- Run all tests: `composer test` or `php artisan test`
- Run a single test: `php artisan test --filter NameOfTest`
- Lint code: `./vendor/bin/pint`
- Artisan commands: `php artisan <command>`

## Architecture
This is a standard Laravel 13 project.
- `app/Http/Controllers`: Handles incoming HTTP requests.
- `app/Models`: Contains Eloquent ORM models representing database tables.
- `app/Providers`: Service providers for bootstrapping the application.
- `routes/`: Defines application endpoints (`web.php`, `console.php`).
- `database/migrations`: Database schema definitions.
- `database/seeders`: Initial data population.
