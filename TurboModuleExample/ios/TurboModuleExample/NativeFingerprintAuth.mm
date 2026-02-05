#import "NativeFingerprintAuth.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTLog.h>

@implementation NativeFingerprintAuth

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeFingerprintAuthSpecJSI>(params);
}

RCT_EXPORT_METHOD(isAvailable:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    LAContext *context = [[LAContext alloc] init];
    NSError *error = nil;

    BOOL canEvaluate = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
                                            error:&error];

    resolve(@(canEvaluate));
}

RCT_EXPORT_METHOD(authenticate:(NSString *)reason
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    LAContext *context = [[LAContext alloc] init];
    NSError *error = nil;

    if (![context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
        reject(@"BIOMETRIC_NOT_AVAILABLE", @"Biometric authentication is not available", error);
        return;
    }

    [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
            localizedReason:reason
                      reply:^(BOOL success, NSError * _Nullable authError) {
        dispatch_async(dispatch_get_main_queue(), ^{
            if (success) {
                resolve(@(YES));
            } else {
                NSString *errorCode = @"AUTH_FAILED";
                NSString *errorMessage = @"Authentication failed";

                if (authError) {
                    switch (authError.code) {
                        case LAErrorUserCancel:
                            errorCode = @"USER_CANCEL";
                            errorMessage = @"User cancelled authentication";
                            break;
                        case LAErrorUserFallback:
                            errorCode = @"USER_FALLBACK";
                            errorMessage = @"User chose fallback authentication";
                            break;
                        case LAErrorSystemCancel:
                            errorCode = @"SYSTEM_CANCEL";
                            errorMessage = @"System cancelled authentication";
                            break;
                        case LAErrorAuthenticationFailed:
                            errorCode = @"AUTH_FAILED";
                            errorMessage = @"Authentication failed";
                            break;
                        default:
                            errorMessage = authError.localizedDescription;
                            break;
                    }
                }

                reject(errorCode, errorMessage, authError);
            }
        });
    }];
}

RCT_EXPORT_METHOD(getBiometricType:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    LAContext *context = [[LAContext alloc] init];
    NSError *error = nil;

    if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
        if (@available(iOS 11.0, *)) {
            switch (context.biometryType) {
                case LABiometryTypeFaceID:
                    resolve(@"face");
                    break;
                case LABiometryTypeTouchID:
                    resolve(@"fingerprint");
                    break;
                default:
                    resolve(@"none");
                    break;
            }
        } else {
            resolve(@"fingerprint");
        }
    } else {
        resolve(@"none");
    }
}

@end
