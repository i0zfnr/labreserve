# Architecture and implementation status

This is an incomplete development build. Do not deploy it or rely on it for real reservations.

The Laravel API has session login via Sanctum, a public lab directory and status endpoint, booking creation and cancellation, administrator approval/rejection, and limited lab create/edit endpoints. The React interface supports directory browsing, sign-in, booking requests, booking lists and approvals. The booking service stores UTC times and locks the lab row in transactions for creation, cancellation, approval and lazy expiration; pending and confirmed reservations block overlaps. Hours and recurring schedules are interpreted in Asia/Kuala_Lumpur. The current two-hour automatic threshold, eight-hour maximum and 24-hour hold are hardcoded, not configurable. Expiration happens lazily during a transaction on the same lab; there is no scheduled expiration worker.

## Verification and open issues

- Seven Laravel tests passed using MySQL 8.4.3 on the separate labreserve_test database, covering sequential conflicts, approval authorization, cancellation, closures and public privacy. Simultaneous requests and locking have not yet been tested.
- The frontend production build succeeded. Browser end-to-end and accessibility tests have not been performed.
- Composer audit reported eight advisories affecting Symfony packages; composer update did not resolve them. Resolve and reassess before deployment.
- The public status endpoint does not account for operating hours, pending holds, or recurring schedules, and has no public status page or QR code. Do not use it as an availability guarantee.
- Configurable rules, scheduled expiration, notifications, rescheduling, reports, calendars, password recovery, user management, complete lab/closure/operating-hour management, policies, deployment documentation and many required tests remain. Audit coverage is incomplete. Dashboard counts are based on the first API page and are not authoritative.
- FullCalendar package versions are not aligned and it is not integrated.

## Target design

Users own bookings; bookings belong to labs and can be reviewed by users. Labs have operating hours, closures, recurring schedules, rules and facilities through a pivot. Historical records should remain available for audit. All changes affecting a lab's availability must take the same lab lock; multiple locks must be acquired in ascending ID order. MySQL concurrency tests are required before the booking engine can be trusted.
