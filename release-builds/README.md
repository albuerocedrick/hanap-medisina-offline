# Installing a release

Use **hanap-medisina-phone.apk** on a phone such as the Redmi Note 10 Pro.
It contains the verified ARM64 phone release, identical to
`hanap-medisina-arm64-v8a.apk`. It requires Android 7.0 or newer.

Use **hanap-medisina-x86_64.apk** for LDPlayer. This emulator build cannot be
installed on an ARM phone.

The generic `android/app/build/outputs/apk/release/app-release.apk` belongs to
whichever architecture was built last. After an emulator build it is an emulator
APK, even though its name does not change. For phone installation, always use
the clearly named phone release in this folder.

APK files are local build artifacts and are not committed to Git.
