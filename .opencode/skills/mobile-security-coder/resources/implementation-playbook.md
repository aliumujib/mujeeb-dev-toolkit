# Mobile Security Coder Implementation Playbook

This playbook provides detailed implementation guidance for mobile security patterns and best practices.

## Table of Contents
1. [WebView Security Implementation](#webview-security-implementation)
2. [Secure Data Storage](#secure-data-storage)
3. [Network Security](#network-security)
4. [Authentication Implementation](#authentication-implementation)
5. [Platform-Specific Security](#platform-specific-security)

## WebView Security Implementation

### Android WebView Security

```kotlin
class SecureWebView(context: Context) : WebView(context) {

    init {
        configureSecurity()
    }

    private fun configureSecurity() {
        settings.apply {
            // Disable JavaScript by default
            javaScriptEnabled = false

            // Enable HTTPS-only
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

            // Disable file access
            allowFileAccess = false
            allowFileAccessFromFileURLs = false
            allowUniversalAccessFromFileURLs = false

            // Disable content access
            allowContentAccess = false

            // Set secure cache mode
            cacheMode = WebSettings.LOAD_NO_CACHE

            // Disable geolocation
            setGeolocationEnabled(false)

            // Disable local storage
            domStorageEnabled = false
        }

        // Configure WebViewClient with URL validation
        webViewClient = SecureWebViewClient()

        // Add JavaScript interface only if absolutely necessary
        // If needed, use @JavascriptInterface with proper validation
    }

    private inner class SecureWebViewClient : WebViewClient() {
        private val allowedDomains = listOf(
            "https://your-trusted-domain.com",
            "https://api.your-domain.com"
        )

        override fun shouldOverrideUrlLoading(
            view: WebView?,
            request: WebResourceRequest?
        ): Boolean {
            request?.url?.let { url ->
                // Validate URL against allowlist
                if (!isUrlAllowed(url)) {
                    Log.w(TAG, "URL blocked: $url")
                    return true // Block the request
                }
            }
            return false
        }

        override fun shouldInterceptRequest(
            view: WebView?,
            request: WebResourceRequest?
        ): WebResourceResponse? {
            request?.url?.let { url ->
                // Validate all resource requests
                if (!isUrlAllowed(url)) {
                    Log.w(TAG, "Resource blocked: $url")
                    return WebResourceResponse(
                        "text/plain",
                        "UTF-8",
                        403,
                        "Forbidden",
                        mapOf(),
                        ByteArrayInputStream("Blocked".toByteArray())
                    )
                }
            }
            return super.shouldInterceptRequest(view, request)
        }

        private fun isUrlAllowed(url: Uri): Boolean {
            return allowedDomains.any { allowedDomain ->
                url.scheme == "https" && url.host?.endsWith(allowedDomain.removePrefix("https://")) == true
            }
        }
    }

    companion object {
        private const val TAG = "SecureWebView"
    }
}
```

### iOS WKWebView Security

```swift
import WebKit

class SecureWebView: WKWebView {
    private let allowedDomains = [
        "your-trusted-domain.com",
        "api.your-domain.com"
    ]

    init(frame: CGRect) {
        let configuration = WKWebViewConfiguration()
        configureSecurity(configuration: configuration)
        super.init(frame: frame, configuration: configuration)
    }

    private func configureSecurity(configuration: WKWebViewConfiguration) {
        // Disable JavaScript
        configuration.preferences.javaScriptEnabled = false

        // Configure Content Security Policy
        let contentController = WKUserContentController()
        let cspScript = """
            var meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = "default-src 'self' https://*.your-domain.com; script-src 'none'; object-src 'none';";
            document.head.appendChild(meta);
        """
        let cspUserScript = WKUserScript(
            source: cspScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        contentController.addUserScript(cspUserScript)
        configuration.userContentController = contentController

        // Disable local storage
        configuration.websiteDataStore = .default()

        // Set URL scheme handler for secure navigation
        configuration.setURLSchemeHandler(
            SecureURLSchemeHandler(),
            forURLScheme: "https"
        )
    }

    func loadSecureURL(url: URL) -> Bool {
        guard isUrlAllowed(url) else {
            print("URL blocked: \\(url)")
            return false
        }
        load(URLRequest(url: url))
        return true
    }

    private func isUrlAllowed(_ url: URL) -> Bool {
        guard url.scheme == "https" else { return false }
        return allowedDomains.contains { url.host?.endsWith($0) ?? false }
    }
}

class SecureURLSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(
        _ webView: WKWebView,
        start urlSchemeTask: WKURLSchemeTask
    ) {
        // Validate and handle secure URL requests
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(
                NSError(domain: "SecurityError", code: 403)
            )
            return
        }

        // Implement request validation and response handling
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // Cleanup
    }
}
```

## Secure Data Storage

### Android Secure Storage

```kotlin
import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class SecureStorage(context: Context) {

    private val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
    private val sharedPreferences = context.getSharedPreferences(
        SECURE_PREFS_NAME,
        Context.MODE_PRIVATE
    )

    fun storeSecureData(key: String, data: String) {
        val secretKey = getOrCreateSecretKey()
        val encryptedData = encryptData(data, secretKey)
        sharedPreferences.edit()
            .putString(key, Base64.encodeToString(encryptedData, Base64.DEFAULT))
            .apply()
    }

    fun getSecureData(key: String): String? {
        val encryptedData = sharedPreferences.getString(key, null) ?: return null
        val secretKey = getOrCreateSecretKey()
        return decryptData(Base64.decode(encryptedData, Base64.DEFAULT), secretKey)
    }

    private fun getOrCreateSecretKey(): SecretKey {
        val alias = "secure_storage_key"
        val existingKey = keyStore.getEntry(alias, null) as? KeyStore.SecretKeyEntry

        return existingKey?.secretKey ?: createSecretKey(alias)
    }

    private fun createSecretKey(alias: String): SecretKey {
        val generator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            ANDROID_KEYSTORE
        )

        val spec = KeyGenParameterSpec.Builder(
            alias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setUserAuthenticationRequired(true)
            .setUserAuthenticationValidityDurationSeconds(30)
            .build()

        generator.init(spec)
        return generator.generateKey()
    }

    private fun encryptData(data: String, key: SecretKey): ByteArray {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, key)
        val iv = cipher.iv
        val encryptedData = cipher.doFinal(data.toByteArray())

        // Combine IV and encrypted data
        return iv + encryptedData
    }

    private fun decryptData(encryptedData: ByteArray, key: SecretKey): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        val gcmSpec = GCMParameterSpec(
            GCM_TAG_LENGTH,
            encryptedData,
            0,
            GCM_IV_LENGTH
        )
        cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec)

        val decryptedData = cipher.doFinal(
            encryptedData,
            GCM_IV_LENGTH,
            encryptedData.size - GCM_IV_LENGTH
        )

        return String(decryptedData)
    }

    companion object {
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val SECURE_PREFS_NAME = "secure_storage"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val GCM_IV_LENGTH = 12
        private const val GCM_TAG_LENGTH = 128
    }
}
```

### iOS Keychain Storage

```swift
import Security
import Foundation
import LocalAuthentication

class SecureStorage {

    enum SecureStorageError: Error {
        case keychainError(OSStatus)
        case authenticationFailed
        case dataConversionFailed
    }

    func storeSecureData(key: String, data: Data, requireBiometrics: Bool = true) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessControl as String: try createAccessControl(requireBiometrics: requireBiometrics)
        ]

        let status = SecItemAdd(query as CFDictionary, nil)

        if status == errSecDuplicateItem {
            // Item exists, update it
            let updateQuery: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrAccount as String: key
            ]
            let updateData: [String: Any] = [
                kSecValueData as String: data
            ]
            let updateStatus = SecItemUpdate(updateQuery as CFDictionary, updateData as CFDictionary)
            guard updateStatus == errSecSuccess else {
                throw SecureStorageError.keychainError(updateStatus)
            }
        } else if status != errSecSuccess {
            throw SecureStorageError.keychainError(status)
        }
    }

    func getSecureData(key: String, requireBiometrics: Bool = true) throws -> Data {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        if requireBiometrics {
            query[kSecUseOperationPrompt as String] = "Authenticate to access secure data"
            query[kSecAttrAccessControl as String] = try createAccessControl(requireBiometrics: true)
        }

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data else {
            throw SecureStorageError.keychainError(status)
        }

        return data
    }

    private func createAccessControl(requireBiometrics: Bool) throws -> SecAccessControl {
        var flags: SecAccessControlCreateFlags = []

        if requireBiometrics {
            flags = .userPresence
        }

        var error: Unmanaged<CFError>?
        let accessControl = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            flags,
            &error
        )

        guard let accessControl = accessControl else {
            throw error!.takeRetainedValue() as Error
        }

        return accessControl
    }
}
```

## Network Security

### Certificate Pinning

```kotlin
import okhttp3.CertificatePinner
import okhttp3.OkHttpClient
import java.security.cert.Certificate
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

class SecureHttpClient {

    fun createSecureClient(): OkHttpClient {
        val certificatePinner = CertificatePinner.Builder()
            .add("your-domain.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
            .add("your-domain.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=")
            .build()

        return OkHttpClient.Builder()
            .certificatePinner(certificatePinner)
            .sslSocketFactory(createSSLSocketFactory(), createTrustManager())
            .build()
    }

    private fun createSSLSocketFactory(): SSLSocketFactory {
        val sslContext = SSLContext.getInstance("TLS")
        sslContext.init(null, arrayOf(createTrustManager()), null)
        return sslContext.socketFactory
    }

    private fun createTrustManager(): X509TrustManager {
        val trustManagerFactory = TrustManagerFactory.getInstance(
            TrustManagerFactory.getDefaultAlgorithm()
        )
        trustManagerFactory.init(null as KeyStore?)
        val trustManagers = trustManagerFactory.trustManagers
        return trustManagers[0] as X509TrustManager
    }
}
```

## Authentication Implementation

### Biometric Authentication (Android)

```kotlin
import android.hardware.biometrics.BiometricPrompt
import androidx.fragment.app.FragmentActivity

class BiometricAuthenticator(private val activity: FragmentActivity) {

    fun authenticate(
        onSuccess: () -> Unit,
        onError: (String) -> Unit,
        onFailed: () -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(activity)

        val biometricPrompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    onSuccess()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    onError(errString.toString())
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    onFailed()
                }
            }
        )

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Biometric Authentication")
            .setSubtitle("Authenticate to access secure features")
            .setNegativeButtonText("Cancel")
            .build()

        biometricPrompt.authenticate(promptInfo)
    }
}
```

### Biometric Authentication (iOS)

```swift
import LocalAuthentication

class BiometricAuthenticator {

    enum BiometricError: Error {
        case notAvailable
        case notEnrolled
        case authenticationFailed
        case userCancel
        case systemCancel
        case userFallback
        case biometryLockout
    }

    func authenticate(
        reason: String = "Authenticate to access secure features",
        completion: @escaping (Result<Void, BiometricError>) -> Void
    ) {
        let context = LAContext()
        var error: NSError?

        // Check if biometric authentication is available
        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            let localizedReason = reason

            context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: localizedReason
            ) { success, evaluationError in
                DispatchQueue.main.async {
                    if success {
                        completion(.success(()))
                    } else {
                        completion(.failure(self.mapError(evaluationError)))
                    }
                }
            }
        } else {
            completion(.failure(.notAvailable))
        }
    }

    private func mapError(_ error: Error?) -> BiometricError {
        guard let error = error as? LAError else {
            return .authenticationFailed
        }

        switch error.code {
        case .biometryNotAvailable:
            return .notAvailable
        case .biometryNotEnrolled:
            return .notEnrolled
        case .userCancel:
            return .userCancel
        case .systemCancel:
            return .systemCancel
        case .userFallback:
            return .userFallback
        case .biometryLockout:
            return .biometryLockout
        default:
            return .authenticationFailed
        }
    }
}
```

## Platform-Specific Security

### Root/Jailbreak Detection

```kotlin
import android.content.Context
import java.io.File

class SecurityValidator(private val context: Context) {

    fun isDeviceSecure(): Boolean {
        return !isRooted() && !isDebuggerAttached() && !isEmulator()
    }

    private fun isRooted(): Boolean {
        // Check for root management apps
        val rootApps = listOf(
            "com.noshufou.android.su",
            "com.thirdparty.superuser",
            "eu.chainfire.supersu"
        )

        rootApps.forEach { packageName ->
            try {
                context.packageManager.getPackageInfo(packageName, 0)
                return true
            } catch (e: PackageManager.NameNotFoundException) {
                // App not found, continue
            }
        }

        // Check for root binaries
        val rootPaths = listOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su"
        )

        return rootPaths.any { File(it).exists() }
    }

    private fun isDebuggerAttached(): Boolean {
        return android.os.Debug.isDebuggerConnected() ||
               android.os.Debug.waitingForDebugger()
    }

    private fun isEmulator(): Boolean {
        return android.os.Build.FINGERPRINT.startsWith("generic") ||
               android.os.Build.FINGERPRINT.startsWith("unknown") ||
               android.os.Build.MODEL.contains("google_sdk") ||
               android.os.Build.MODEL.contains("Emulator") ||
               android.os.Build.MANUFACTURER.contains("Genymotion")
    }
}
```

```swift
import Foundation
import UIKit

class SecurityValidator {

    func isDeviceSecure() -> Bool {
        return !isJailbroken() && !isDebuggerAttached()
    }

    private func isJailbroken() -> Bool {
        // Check for jailbreak indicators
        let jailbreakIndicators = [
            "/Applications/Cydia.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash",
            "/usr/sbin/sshd",
            "/etc/apt",
            "/private/var/lib/apt/",
            "/Applications/blackra1n.app",
            "/Applications/FakeCarrier.app",
            "/Applications/Icy.app",
            "/Applications/IntelliScreen.app",
            "/Applications/MxTube.app",
            "/Applications/RockApp.app",
            "/Applications/SBSettings.app",
            "/Applications/WinterBoard.app",
            "/private/var/lib/cydia",
            "/var/cache/apt",
            "/var/lib/cydia",
            "/usr/bin/sshd",
            "/usr/libexec/sftp-server",
            "/var/tmp/cydia.log",
            "/var/lib/apt/"
        ]

        for path in jailbreakIndicators {
            if FileManager.default.fileExists(atPath: path) {
                return true
            }
        }

        // Check if we can write outside the app sandbox
        let testString = "test"
        let testPath = "/private/jailbreak_test.txt"

        if let _ = try? testString.write(toFile: testPath, atomically: true, encoding: .utf8) {
            try? FileManager.default.removeItem(atPath: testPath)
            return true
        }

        return false
    }

    private func isDebuggerAttached() -> Bool {
        var info = kinfo_proc()
        var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
        var size = MemoryLayout<kinfo_proc>.stride

        let sysctlResult = sysctl(&mib, u_int(mib.count), &info, &size, nil, 0)

        return sysctlResult == 0 && (info.kp_proc.p_flag & P_TRACED) != 0
    }
}
```

## Security Testing Checklist

### Pre-Release Security Checks

- [ ] All WebView instances configured with HTTPS-only
- [ ] JavaScript disabled in WebViews unless absolutely necessary
- [ ] Input validation implemented on all user inputs
- [ ] Sensitive data encrypted before storage
- [ ] Biometric authentication implemented for sensitive operations
- [ ] Certificate pinning implemented for critical API endpoints
- [ ] Root/jailbreak detection implemented with graceful degradation
- [ ] Debug logging removed or disabled in production builds
- [ ] Code obfuscation enabled (ProGuard/R8 for Android, bitcode for iOS)
- [ ] Sensitive data excluded from app backups
- [ ] Deep links validated before processing
- [ ] Third-party SDKs reviewed for security implications
- [ ] Location data handling complies with privacy requirements
- [ ] Push notification payloads don't contain sensitive information
- [ ] Session management implements proper timeout and cleanup

### Runtime Security Checks

- [ ] Device security validation before sensitive operations
- [ ] Network environment validation for API calls
- [ ] Runtime permission requests follow principle of least privilege
- [ ] Background/foreground transitions trigger security checks
- [ ] App lifecycle events clear sensitive data from memory
- [ ] Memory cleared when app moves to background
- [ ] Screenshots/recording prevented for sensitive screens
- [ ] Clipboard data cleared after use
- [ ] SSL/TLS certificate validation never bypassed
- [ ] API responses validated and sanitized

This playbook should be used as a reference guide. Always adapt security implementations to your specific app requirements and threat model.
