# VanSetu Changelog

All notable changes to the VanSetu project will be documented in this file.

## [Phase 2 - GIS Engine] - 2026-08-27

### Added
- **Leaflet WebGIS Atlas Canvas**: Integrated interactive map canvas with CartoDB Dark Matter basemap, vector layer controls, and zoom controls.
- **Administrative Boundary Layers**: Created static GeoJSON boundaries for Odisha districts (Kandhamal, Mayurbhanj), tehsils (Balliguda, Phulbani, Baripada, Rairangpur), and villages (Daringbadi, Chakapada, Similipal, Kiriburu).
- **Synthetic GeoJSON Claim Polygons**: Seeded 18 distinct synthetic claim polygons across Kandhamal and Mayurbhanj with status-based styling:
  - `APPROVED`: Emerald Green (`#10B981`)
  - `SUBMITTED`/`GRAM_SABHA_REVIEW`/`SUBDIVISION_REVIEW`/`DISTRICT_REVIEW`: Cyan Blue (`#06B6D4`)
  - `FIELD_VERIFICATION`/`NEEDS_CORRECTION`: Amber Gold (`#F59E0B`)
  - `CONFLICT_REVIEW`: Crimson Red (`#EF4444`)
  - `REJECTED`: Slate Gray (`#64748B`)
- **PII-Free Bulk Spatial Endpoint (Blueprint §17)**: `GET /api/claims/spatial` returns GeoJSON FeatureCollection with zero claimant PII.
- **Role-Scoped Atlas RBAC (Blueprint §15)**:
  - `CITIZEN`: Sees only own submitted claims on map.
  - `FIELD_OFFICER` & `DISTRICT_ADMIN`: See district-scoped claims.
  - `STATE_ADMIN`: Full state-wide visibility.
- **Per-Claim Detail Drawer**: Clicking a polygon fetches `GET /api/claims/:id` (behind auth & ownership check) and slides out a detailed view with status, claimant profile, location, and risk scores.
- **Marker Clustering & GeoJSON Performance**: Integrated `Leaflet.markercluster` for scaled point rendering.
- **Multi-Criteria Filter Toolbar**: Filter by State, District, Tehsil, Village, Claim Type (`IFR`/`CR`/`CFR`), Status, and Risk Level (`LOW`/`MEDIUM`/`HIGH`/`CRITICAL`).

## [Phase 1 - Foundation] - 2026-08-27

### Added
- **Docker Compose Setup**: Added official `postgis/postgis:15-3.3-alpine` database configuration on host port 5433.
- **Backend Infrastructure**: Express + TypeScript + Prisma ORM + JWT Auth + Helmet + Rate Limiter.
- **Database Schema**: Created `User`, `RefreshToken`, `Claim`, `Evidence`, `Conflict`, and `AuditLog` tables.
- **Auth & RBAC System**: Registration, login with brute-force lockout, server-side refresh token revocation, and role-based access control.
