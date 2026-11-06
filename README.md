# LabReserve

LabReserve is an **incomplete development build**, not ready for institutional or production use. It contains an initial Laravel API and React interface for lab browsing, session login, booking creation and cancellation, and approval decisions. See [implementation status](docs/architecture.md) for limitations.

## Local development on Windows

Requirements: PHP 8.3+, Composer, Node.js and npm. MySQL 8 is required to verify production locking behavior; SQLite can be used for initial development only.

```powershell
cd C:\laragon\www\labreserve\backend
composer install
Copy-Item .env.example .env   # only if .env does not already exist
php artisan key:generate
php artisan migrate
```

To create example labs and a local administrator, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `backend/.env` to values you choose, then run `php artisan db:seed`. The seeder creates the administrator only in the `local` environment. Do not commit the `.env` file. The sample labs have weekday hours 08:00–18:00 Malaysia time.

For MySQL, start MySQL through Laragon and create a database named `labreserve`. Set `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=labreserve` and the local database credentials in `backend/.env`, then run migrations and the seeder. The local application is configured to use MySQL.

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

In a second terminal:

```powershell
cd C:\laragon\www\labreserve\frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open the Vite URL printed by npm using `127.0.0.1` consistently; Vite proxies API and Sanctum requests to port 8000. To run checks: `cd backend; php vendor/bin/phpunit --configuration phpunit.mysql.xml` and `cd frontend; npm run build`. The MySQL test configuration uses `labreserve_test` and resets its tables; never point it at a database containing data you need. Create that separate database before running the tests.

The account creation UI, password reset and lecturer management have not been implemented. The local seed administrator is for development only.
