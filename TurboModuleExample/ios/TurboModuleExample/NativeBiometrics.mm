#import "NativeBiometrics.h"
#import <LocalAuthentication/LocalAuthentication.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <TurboModuleExampleSpec/TurboModuleExampleSpec.h>
#endif

@interface NativeBiometrics ()
#ifdef RCT_NEW_ARCH_ENABLED
<NativeBiometricsSpec>
#endif
@end

@implementation NativeBiometrics

RCT_EXPORT_MODULE()

- (NSString *)getBiometricTypeString:(LABiometryType)biometryType {
  switch (biometryType) {
    case LABiometryTypeFaceID:
      return @"faceId";
    case LABiometryTypeTouchID:
      return @"fingerprint";
    case LABiometryTypeOpticID:
      return @"iris";
    default:
      return @"none";
  }
}

RCT_EXPORT_METHOD(isAvailable:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;
  BOOL canEvaluate = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  resolve(@(canEvaluate));
}

RCT_EXPORT_METHOD(getBiometricType:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;

  if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
    resolve([self getBiometricTypeString:context.biometryType]);
  } else {
    resolve(@"none");
  }
}

RCT_EXPORT_METHOD(authenticate:(NSString *)reason
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;

  if (![context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
    resolve(@{
      @"success": @NO,
      @"error": error.localizedDescription ?: @"Biometric authentication not available",
      @"biometricType": @"none"
    });
    return;
  }

  NSString *biometricType = [self getBiometricTypeString:context.biometryType];

  [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
          localizedReason:reason
                    reply:^(BOOL success, NSError * _Nullable authError) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (success) {
        resolve(@{
          @"success": @YES,
          @"biometricType": biometricType
        });
      } else {
        resolve(@{
          @"success": @NO,
          @"error": authError.localizedDescription ?: @"Authentication failed",
          @"biometricType": biometricType
        });
      }
    });
  }];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeBiometricsSpecJSI>(params);
}
#endif

@end
