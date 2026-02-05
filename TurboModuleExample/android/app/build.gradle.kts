plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.facebook.react")
}

react {
    autolinkLibrariesWithApp()
}

android {
    namespace = "com.turbomoduleexample"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.turbomoduleexample"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("com.facebook.react:react-android")

    // Biometric authentication
    implementation("androidx.biometric:biometric:1.2.0-alpha05")

    // Fragment support for BiometricPrompt
    implementation("androidx.fragment:fragment-ktx:1.6.2")

    // Core KTX
    implementation("androidx.core:core-ktx:1.12.0")

    if (project.hasProperty("hermesEnabled") && project.property("hermesEnabled") == "true") {
        implementation("com.facebook.react:hermes-android")
    } else {
        implementation("org.webkit:android-jsc:+")
    }
}
