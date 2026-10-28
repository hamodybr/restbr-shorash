# SHORASH Staff Menu — Android Offline APK (pilot)

Scope: read-only waiter menu. Separate Android Capacitor project. Does not edit the existing public website, order checkout, dashboard, or QR routes.

The app bundles its own HTML, CSS, and JavaScript. Menu data are downloaded from SHORASH's existing Supabase project with the public publishable key configured in the repository. The APK does not include a service-role key or admin access.

## Offline capabilities

- Local database snapshot of categories, products, options, discounts, and public restaurant settings.
- Arabic, English, and Kurdish product labels, search, dine-in/takeaway visibility and pricing.
- Compressed copies of public product images stored under Android internal Directory.Data.
- After first successful synchronization, reopen in airplane mode and after reboot.

The app is view-only: no order submission, online admin access, or WhatsApp orders. Menu changes require a successful sync to reach a tablet.

## Build APK in GitHub Actions

The workflow at .github/workflows/shorash-staff-android.yml runs tests and builds a debug APK on the pilot branch. Open Actions > SHORASH Staff APK (pilot), select the latest successful run, download the shorash-staff-debug-apk artifact, extract it and install app-debug.apk on an Android test tablet. You can trigger the workflow manually while on the pilot branch.

Debug APKs are for internal testing, not for production app stores. Before broad deployment, make a consistently signed release APK and test updates in-place using the same signing key.

## Build locally (Node 22+, Android Studio & SDK)

From the staff folder:

    npm install
    npm test
    npm run build
    npx cap add android
    npx cap sync android
    cd android
    ./gradlew assembleDebug

On Windows, use gradlew.bat assembleDebug. The APK is in android/app/build/outputs/apk/debug/app-debug.apk.

Capacitor pinned to 8.x for this pilot. The app uses @capacitor/filesystem in internal Data storage, not a browser cache or localStorage for menu records.

## First-time tablet setup

1. Install APK and connect to Wi-Fi.
2. Open SHORASH Staff Menu and tap تحديث المنيو.
3. Keep app open until it reports محفوظ على الجهاز and a last-update timestamp.
4. Switch to airplane mode, force-close and reopen. Inspect several categories, images and both price modes.
5. Reconnect Wi-Fi, change one price on the existing dashboard, tap Update, confirm new price and unchanged imagery.

## Safety design

Two snapshot slots (snapshot-a.json and snapshot-b.json) are kept in native app data. New records and images are fully downloaded before the inactive slot is written and read back. If sync fails, the last working slot remains. Empty catalogs are rejected. Only product images with changed URL or product updated_at are re-downloaded. Files are not purged in this pilot, to preserve rollback.

The app refreshes on initial open, reconnection, or manual button. No background network access or live sockets. A last successful sync timestamp is shown.

Caveats: deleting app data removes offline content. Public product images that cannot be fetched block a new snapshot rather than falsely reporting readiness. Tablet clock must be accurate for scheduled availability. Hardware testing is mandatory before rollout.

## Validation focus

- First-time load, airplane-mode cold start and reboot.
- Dine-in/takeaway price (including discounts), service-mode filtering.
- Image changes, new and deleted products.
- Interrupted sync and low disk space.
- Supabase RLS: public select only.
- Arabic/Badini/English text, long labels, large catalog, storage and battery measurements.

Source js/runtime-config.js supplies the existing restaurant publishable Supabase values; build copies it into Android bundle. Verify it points to intended restaurant before deploying. No API secrets required.
