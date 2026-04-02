# Android Release Process

Bu dokuman `verii_wms_mobile` Android APK yayin akisinin tek kaynak ozetidir.

## 1. Hangi dosyalarda versiyon guncellenir

Her yeni APK release'inde bu alanlar birlikte artirilir:

1. `/Users/cannasif/Documents/V3rii/verii_wms_mobile/package.json`
   - `version`
2. `/Users/cannasif/Documents/V3rii/verii_wms_mobile/package-lock.json`
   - root `version`
   - `packages[""].version`
3. `/Users/cannasif/Documents/V3rii/verii_wms_mobile/app.json`
   - `expo.version`
   - `expo.ios.buildNumber`
   - `expo.android.versionCode`
4. `/Users/cannasif/Documents/V3rii/verii_wms_mobile/android/app/build.gradle`
   - `versionName`
   - `versionCode`

Not:
- Bu projede native `android/` klasoru kullanildigi icin sadece `app.json` degistirmek yeterli degildir.
- Android APK build'i icin `android/app/build.gradle` de ayni degerlerle guncel tutulmalidir.

## 2. Versiyonlama kurali

Onerilen kural:

- Kullaniciya gorunen surum: `1.0.5`
- Android sayisal build kodu: `6`

Ornek artis:

1. `1.0.2` -> `versionCode 3`
2. `1.0.3` -> `versionCode 4`
3. `1.0.4` -> `versionCode 5`
4. `1.0.5` -> `versionCode 6`

Kural:
- Her yeni APK release'inde `versionCode` mutlaka artmali
- Sadece `versionName` artarsa Android update karsilastirmasi saglikli calismaz

## 3. APK nasil alinir

Proje kokunden Android release APK build komutu:

```bash
cd /Users/cannasif/Documents/V3rii/verii_wms_mobile/android
./gradlew assembleRelease
```

Olusan ham APK:

```text
/Users/cannasif/Documents/V3rii/verii_wms_mobile/android/app/build/outputs/apk/release/app-release.apk
```

Yayin icin kopyalama:

```bash
mkdir -p /Users/cannasif/Documents/V3rii/verii_wms_mobile/releases
cp /Users/cannasif/Documents/V3rii/verii_wms_mobile/android/app/build/outputs/apk/release/app-release.apk \
  /Users/cannasif/Documents/V3rii/verii_wms_mobile/releases/verii-wms-1.0.5.apk
```

## 4. API tarafinda ne guncellenir

API manifest dosyasi:

`/Users/cannasif/Documents/V3rii/verii_wms_api/srcWms/Wms/Shared/Host/WebApi/Assets/AndroidVersions/versions.json`

Ornek:

```json
{
  "android": {
    "latestVersion": "1.0.5",
    "latestVersionCode": 6,
    "minimumSupportedVersion": "1.0.5",
    "minimumSupportedVersionCode": 6,
    "apkFileName": "verii-wms-1.0.5.apk",
    "apkUrl": "",
    "releaseNotes": "Release notes buraya yazilir.",
    "publishedAtUtc": "2026-04-02T21:00:00Z"
  }
}
```

Alanlar:

1. `latestVersion`
   - Kullaniciya gorunen son surum
2. `latestVersionCode`
   - Android update kontrolunde esas alinacak sayisal deger
3. `minimumSupportedVersion`
   - En dusuk desteklenen surum
4. `minimumSupportedVersionCode`
   - Bunun Android sayisal karsiligi
5. `apkFileName`
   - Sunucuda yayinlanan APK dosya adi
6. `apkUrl`
   - Bos birakilirsa API kendi static URL'sini uretir
7. `releaseNotes`
   - Uygulamada gosterilecek not

## 5. APK sunucuya nereye konur

Sunucudaki klasor:

```text
C:\inetpub\wwwroot\wms-api\Shared\Host\WebApi\Assets\AndroidVersions
```

Dosya burada tam ismiyle durmali:

```text
verii-wms-1.0.5.apk
```

Kontrol URL'si:

```text
https://api.v3rii.com/android-versions/verii-wms-1.0.5.apk
```

Bu URL acilmiyorsa update indirme de calismaz.

## 6. Force update nasil calisir

API compare mantigi:

- `currentVersionCode < latestVersionCode` ise update var
- `currentVersionCode < minimumSupportedVersionCode` ise force update var

Ornek:

1. Cihaz `versionCode = 5`
2. Manifest:
   - `latestVersionCode = 6`
   - `minimumSupportedVersionCode = 6`

Sonuc:
- update var
- force update var

Opsiyonel update icin:

1. Cihaz `versionCode = 5`
2. Manifest:
   - `latestVersionCode = 6`
   - `minimumSupportedVersionCode = 5`

Sonuc:
- update var
- force update yok

## 7. Release adimlari ozet

Her yeni Android release icin sira:

1. Mobile dosyalarinda versiyonlari artir
2. `./gradlew assembleRelease` ile APK al
3. APK'yi `releases/` altina kopyala
4. APK'yi sunucuda `AndroidVersions` klasorune koy
5. `versions.json` dosyasini guncelle
6. Gerekirse API'yi deploy et
7. `version-check` ve APK URL'sini test et

## 8. Hızlı test listesi

1. APK URL aciliyor mu
2. `/api/mobile/version-check` dogru `latestVersionCode` donuyor mu
3. App release notes ekraninda son surum dogru mu
4. Update var ise `Guncelle` butonu cikiyor mu
5. Force update ise erteleme davranisi kapanmis mi
