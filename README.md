# TodoDesk UI

React + Vite frontend for the multi-tenant Todo Management API.

## Run

```bash
cd todo-management-ui
yarn install
yarn dev
```

UI: http://localhost:5173  
API proxy: `/api` → http://localhost:8080

## Multi-tenant model (username = tenant)

- **Username** is used as `X-Tenant-Id` (tenant DB `todo_<username>`).
- **Register** auto-creates the tenant if needed, then registers the user there.
- **Login** sets tenant from username, then authenticates.
- **Todos** send `X-Tenant-Id` + HTTP Basic credentials.

No separate workspace / tenant picker.
