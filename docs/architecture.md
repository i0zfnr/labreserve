# Architecture and implementation status

This is an incomplete development build. Do not deploy it or rely on it for real reservations.

The Laravel API has session login via Sanctum, a public lab directory and status endpoint, booking creation, same-lab rescheduling and cancellation, administrator approval/rejection, and administrator lab, operating-hour, and maintenance-closure endpoints. The React interface supports directory browsing, sign-in, booking requests, booking lists, approvals, lecturer account creation and activation, and lab administration. The booking service stores UTC times and locks the lab row in transactions for creation, cancellation, approval and lazy expiration; pending and confirmed reservations block overlaps. Hours and recurring schedules are interpreted in Asia/Kuala_Lumpur. The current two-hour automatic threshold, eight-hour maximum and 24-hour hold are hardcoded, not configurable. Expiration is also scheduled every minute via bookings:expire, which takes the same lab lock. Run the Laravel scheduler for timely expiry.

## Verification and open issues

- Twenty-three Laravel tests passed using MySQL 8.4.3 on the separate labreserve_test database. These cover booking conflicts, approval authorization, cancellation, expiration, closures and public privacy. A two-process test starts overlapping booking attempts together and checks that only one succeeds; further contention and transition tests remain necessary.
- The frontend production build succeeded. Browser end-to-end and accessibility tests have not been performed.
- Composer audit reported eight advisories affecting Symfony packages; composer update did not resolve them. Resolve and reassess before deployment.
- The public status endpoint considers current operating hours, pending holds, confirmed bookings, recurring schedules and maintenance. The next-booking field only covers confirmed bookings. There is no public status page or QR code, and the status is not a future availability guarantee.
- Configurable rules, notifications, cross-lab rescheduling, reports, password recovery, lecturer editing, lab facilities management, policies, deployment documentation and many required tests remain. Audit coverage is incomplete. Dashboard counts are based on the first API page and are not authoritative.
- FullCalendar provides day, week and month views. The public calendar intentionally hides subjects and user details. Availability is advisory and is rechecked when submitting a booking. Facility filtering and public QR pages remain.

## Target design

Users own bookings; bookings belong to labs and can be reviewed by users. Labs have operating hours, closures, recurring schedules, rules and facilities through a pivot. Historical records should remain available for audit. All changes affecting a lab's availability must take the same lab lock; multiple locks must be acquired in ascending ID order. Broader MySQL concurrency and security tests are required before the booking engine can be trusted.

Operating-hours updates are conservatively blocked when a lab has active or future bookings or recurring schedules. Closures cannot overlap existing active bookings, recurring sessions, or other closures; only future closures can be removed. New labs start closed until hours are configured. All lab availability changes take the lab row lock.

Future pending or confirmed bookings can be rescheduled within the same lab. The operation locks the lab row, checks the new period using the booking rules, keeps the original reservation on failure, and records an audit entry. Previously approval-required requests return to pending after a time change. The MySQL test suite includes concurrent reschedule and create attempts for the same slot.
