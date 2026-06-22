# SecureMessagingApp

SecureMessagingApp is a simple real-time chat application consisting of:

- A backend API built with ASP.NET Core (net10.0) using Entity Framework Core + SQLite, ASP.NET Identity, JWT authentication and SignalR for real-time messaging.
- A frontend single-page app built with Angular (v21) that connects to the SignalR hub and the API.

## Tech stack

- Backend: .NET 10, ASP.NET Core, EF Core (Sqlite), ASP.NET Identity, SignalR, JWT
- Frontend: Angular 21, @microsoft/signalr

## Quickstart

Prerequisites:

- .NET 10 SDK (install from https://dotnet.microsoft.com)
- Node.js + npm (project uses `npm@11.x` in `client/package.json`)
- Angular CLI (optional, for local development) - `npm install -g @angular/cli`

Run the backend API (defaults to a local SQLite DB `chat.db`):

```powershell
dotnet restore
dotnet build
dotnet run --project SecureMessagingApp/API
```

When the API starts it will expose the SignalR hub at `/hubs/chat` and the account endpoints as defined in `API/Endpoints/AccountEndpoint.cs`.

Run the Angular client:

```bash
cd SecureMessagingApp/client
npm install
npm start
```

Open the browser at `http://localhost:4200`.

## Database & Migrations

- The project is configured to use SQLite (`Data Source=chat.db`) in `Program.cs` via `UseSqlite("Data Source=chat.db")`.
- Migrations are included under `API/Migrations`. If you prefer applying migrations manually, install the EF tools and run `dotnet ef database update --project SecureMessagingApp/API` from the repository root.

## Configuration

- The API reads JWT configuration from `API/appsettings.json` under the `JwtSetting` section. Example:

```json
"JwtSetting": {
  "SecurityKey": "THIS_IS_A_SUPER_SECRET_KEY_1234567890"
}
```

Note: The `TokenService` reads configuration using the key `JWTSetting:SecurityKey` (uppercase `JWTSetting`) while `Program.cs` expects `JwtSetting`. If tokens fail to generate or validate, make sure the keys match (recommended: use `JwtSetting:SecurityKey`).

## Project structure (key folders)

- `SecureMessagingApp.sln` — Visual Studio / dotnet solution
- `SecureMessagingApp/API` — Backend API (Program.cs, Data, Hubs, Models, Services, Endpoints)
- `SecureMessagingApp/client` — Angular frontend

Important files:

- API entry: [SecureMessagingApp/API/Program.cs](SecureMessagingApp/API/Program.cs)
- DB context: [SecureMessagingApp/API/Data/AppDbContext.cs](SecureMessagingApp/API/Data/AppDbContext.cs)
- SignalR hub: [SecureMessagingApp/API/Hubs/ChatHub.cs](SecureMessagingApp/API/Hubs/ChatHub.cs)
- Token helper: [SecureMessagingApp/API/Services/TokenService.cs](SecureMessagingApp/API/Services/TokenService.cs)
- Frontend README: [SecureMessagingApp/client/README.md](SecureMessagingApp/client/README.md)

When mentioning files above, paths are relative to the repository root.

## Known issues & troubleshooting

- JWT config key mismatch: see Configuration section above.
- If the Angular client cannot connect to the hub, ensure CORS and the hub URL are correct (`Program.cs` config allows `http://localhost:4200`).
- If `chat.db` is not created, check file permissions in the running folder and ensure the API startup has write access.

## Next steps / suggestions

- Add CI workflow to build and test both backend and frontend.
- Add missing unit/integration tests for the hub and API endpoints.
- Consider moving secrets (JWT key) into environment variables or user secrets for production.

## Contact

If you want, I can:

- Fix the `JWTSetting` vs `JwtSetting` mismatch in `TokenService`.
- Add a small `docker-compose` to run the API and client together.
