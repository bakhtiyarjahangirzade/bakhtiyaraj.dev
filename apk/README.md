# KuryeBro Android

The APK bundles the same versioned web assets tested for the website. It launches at
`https://localhost` without a network connection. Android records location in a
non-exported foreground service, with a notification, only during a user-started shift.
The app requests precise location and, on Android 13+, notification permission.
The route journal remains in app-private storage while the WebView is suspended.

## Build and verify

Requirements: Node 22+, JDK 17, Android SDK platform 36 and build-tools 35.0.0, and an Android
emulator or device for instrumentation tests. Set JAVA_HOME and ANDROID_HOME, or
configure android/local.properties with sdk.dir.

From the repository root:

    npm ci
    npm test
    npm run build:web
    npm run test:budget:browser
    node tests/budget-security.live.mjs

Then from apk/:

    npm ci
    npm run build
    android/gradlew.bat -p android :app:connectedDebugAndroidTest :app:lintRelease

On macOS/Linux use android/gradlew instead of gradlew.bat. `npm run build` in this
folder produces an unsigned, non-debuggable release APK; `npm run build:debug` is
for testing. Never publish the debug APK. Capacitor's tar default-export adapter
in cap.cjs permits using the patched tar 7 dependency with Capacitor 6.

The root build prepares apk/www automatically and generates a complete, hashed
PWA precache manifest. apk/www is generated and must not be edited or committed.
The website's other desktop installers are outside the Android build. The root
build:web command skips those installers, which require their own build tools.

## Signing and updates

Use sign-release.ps1 with the release key, its user-encrypted DPAPI password file,
the original legacy key, Android build-tools path, and desired output APK.
Private keys and password files must stay outside Git and outside site hosting.
`signing-lineage.bin` is a public proof of signing-key rotation, not a private key.

The current release rotates the original signing certificate to a dedicated
KuryeBro release certificate on Android 9+. Android 5.1–8.1 retain the old signer
for update compatibility. All variants disable android:debuggable. The original
key remains necessary when signing compatible updates for those older versions.
The signing script refuses debuggable APKs and verifies the final signature.

StorageMigration copies bt.* local-storage records from the former hosted origin
into the local origin using an offline WebView. Existing local-origin records
win; source records remain intact. The migration is covered by instrumentation.

## Verification scope

Browser tests cover daily-total reconciliation, entry editing and undo, currency
protection, localization, small screens, a full offline shell, authenticated local
persistence with a mocked backend, sync ownership, and JSON backups. Unit tests
cover cent arithmetic, invalid inputs, date handling, timestamp ties, pagination,
in-flight edits, manual/GPS metric precedence and legacy-total detection.

Android 14 and Android 16 emulator tests cover the JavaScript bridge, foreground recording with
the display off and the activity backgrounded, durable route storage, offline
launch, migration from the old WebView origin, the version bridge, system insets and back navigation. Android release lint is also run.

Physical-device GPS accuracy, battery consumption, manufacturer power managers,
all older Android releases, require separate field validation. Password-reset email delivery is excluded by
the owner. The live security checks include anonymous access plus 37 authenticated
checks using two disposable identities: cross-owner access, receipts, route parents,
admin privileges, recovery tokens, optimistic concurrency and deletion/reset gates.
Test identities and their privileged harness are removed or disabled afterwards.

Older daily totals mixed with itemised records are flagged in Reports. They are
not silently rewritten because the intended historical totals cannot be inferred.
Manually verify those dates and save the intended total to reconcile them.

Voice files are not included in this repository; unsupported voice claims and
controls stay hidden until actual language assets are provided.

## 1.2.0 lifecycle upgrade

Apply the additive SQL migrations in this order on top of budgettracker.sql:
budgettracker-lifecycle.sql, budgettracker-timezone-overview.sql,
budgettracker-account.sql, budgettracker-account-scope-fix.sql,
budgettracker-unique-days.sql. They are already applied to the production project.
Deploy supabase/functions/budget-account/index.ts with gateway JWT verification off;
the function itself validates every bearer token with Auth getUser, requires the
current password for deletion, and never accepts a caller-supplied target identity.
Never expose the service-role key to the web client or APK.

The reset epoch is checked before uploads. After a deletion, old clients without
the current epoch cannot write erased data back. Shared application identities and
the last administrator are protected. Receipt objects are deleted through Storage,
not by deleting only storage.objects database rows.

Entry writes use bt_save_entries and the last server revision; conflicts require
an explicit user choice. Daily balance IDs are stable and a partial unique index
prevents two devices creating a second active balance for the same day and kind.
Existing historical records are not rewritten by the migrations.

Backups use version 2 with owner metadata and strict validation. Version 1 remains
readable. Cross-account imports remap identifiers and receipt paths deterministically;
re-imports preserve current records. An active shift is imported as a completed
snapshot and never starts the location service.

After signing, generate releases.json from the APK itself:

    node scripts/budget-release.mjs /path/to/signed.apk /path/to/aapt

Publish the APK and releases.json together. The Android update button opens only
the fixed official download URL. Signed AAB output is for Play Console submission;
building it does not publish it to Google Play. The separately delivered encrypted
portable signing backup is independent of Windows DPAPI and includes recovery
instructions. Its recovery key must remain separate and private.
