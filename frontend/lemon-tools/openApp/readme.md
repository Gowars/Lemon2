# Universal Links 技术详解: iOS 和 Android 平台

Universal Links（通用链接）是一种允许应用程序处理网站链接的技术。它可以让用户无缝地从网页跳转到已安装的应用程序，如果应用未安装，则会打开网页版本。

## iOS: Universal Links

### 工作原理
1. 当用户点击一个链接时，iOS 会检查该域名是否与任何已安装应用的 Universal Links 配置匹配。
2. 如果匹配，iOS 会直接打开相应的应用。
3. 如果不匹配或应用未安装，则在 Safari 中打开链接。

### 兼容性
- iOS 9 及以上版本支持
- 几乎所有现代 iOS 设备都支持

### 接入步骤

#### 对于 App：

1. 在 Xcode 中启用 Associated Domains 功能。
2. 在 `Signing & Capabilities` 标签页中添加域名，格式如：`applinks:yourdomain.com`。
3. 实现 `UIApplicationDelegate` 方法来处理 Universal Links：

```swift
func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
       let url = userActivity.webpageURL {
        // 处理 URL
        return true
    }
    return false
}
```

#### 对于网站：

1. 创建一个 `apple-app-site-association` (AASA) JSON 文件：

```json
{
    "applinks": {
        "apps": [],
        "details": [
            {
                "appID": "TEAM_ID.BUNDLE_ID",
                "paths": ["*"]
            }
        ]
    }
}
```

2. 将此文件放置在 `https://yourdomain.com/.well-known/apple-app-site-association`。

## Android: App Links

### 工作原理
类似于 iOS，但 Android 称之为 App Links。

### 兼容性
- Android 6.0 (API level 23) 及以上版本完全支持
- 旧版本会显示应用选择器

### 接入步骤

#### 对于 App：

1. 在 `AndroidManifest.xml` 中添加 intent filter：

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="yourdomain.com" />
</intent-filter>
```

2. 在 Activity 中处理传入的 intent：

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    val action: String? = intent?.action
    val data: Uri? = intent?.data

    if (action == Intent.ACTION_VIEW && data != null) {
        // 处理 URL
    }
}
```

#### 对于网站：

1. 创建一个 `assetlinks.json` 文件：

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.yourdomain.app",
    "sha256_cert_fingerprints": ["SHA256 证书指纹"]
  }
}]
```

2. 将此文件放置在 `https://yourdomain.com/.well-known/assetlinks.json`。

## JavaScript 接入

对于网页端，主要任务是提供正确的链接。无需特殊的 JavaScript 代码来启用 Universal Links。

但是，您可以使用 JavaScript 来增强用户体验：

1. 检测设备类型：

```javascript
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isAndroid() {
    return /Android/.test(navigator.userAgent);
}
```

2. 根据设备类型提供适当的链接：

```javascript
function getUniversalLink(path) {
    const baseUrl = 'https://yourdomain.com';
    if (isIOS() || isAndroid()) {
        return `${baseUrl}/${path}`;
    } else {
        return `${baseUrl}/fallback/${path}`;
    }
}

// 使用
const link = document.getElementById('myLink');
link.href = getUniversalLink('product/123');
```

## 注意事项

1. 确保 AASA 和 assetlinks.json 文件正确配置且可访问。
2. 对于 iOS，AASA 文件必须通过 HTTPS 提供。
3. 定期更新 SHA256 证书指纹（Android）。
4. 考虑提供后备网页版本，以防应用未安装。
5. 测试各种场景，包括应用已安装/未安装、不同的 OS 版本等。

通过正确实施 Universal Links，您可以大大改善用户体验，提供无缝的网页到应用的跳转。
