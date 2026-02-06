#import "NativeNotifications.h"
#import <UserNotifications/UserNotifications.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <TurboModuleExampleSpec/TurboModuleExampleSpec.h>
#endif

@interface NativeNotifications ()
#ifdef RCT_NEW_ARCH_ENABLED
<NativeNotificationsSpec>
#endif
@end

@implementation NativeNotifications

RCT_EXPORT_MODULE()

- (NSString *)authorizationStatusToString:(UNAuthorizationStatus)status {
  switch (status) {
    case UNAuthorizationStatusAuthorized:
    case UNAuthorizationStatusProvisional:
    case UNAuthorizationStatusEphemeral:
      return @"granted";
    case UNAuthorizationStatusDenied:
      return @"denied";
    case UNAuthorizationStatusNotDetermined:
    default:
      return @"notDetermined";
  }
}

RCT_EXPORT_METHOD(requestPermission:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  UNAuthorizationOptions options = UNAuthorizationOptionAlert | UNAuthorizationOptionSound | UNAuthorizationOptionBadge;

  [center requestAuthorizationWithOptions:options
                        completionHandler:^(BOOL granted, NSError * _Nullable error) {
    if (error) {
      reject(@"PERMISSION_ERROR", error.localizedDescription, error);
      return;
    }

    [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
      dispatch_async(dispatch_get_main_queue(), ^{
        resolve([self authorizationStatusToString:settings.authorizationStatus]);
      });
    }];
  }];
}

RCT_EXPORT_METHOD(getPermissionStatus:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];

  [center getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
    dispatch_async(dispatch_get_main_queue(), ^{
      resolve([self authorizationStatusToString:settings.authorizationStatus]);
    });
  }];
}

RCT_EXPORT_METHOD(showNotification:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  NSString *title = options[@"title"];
  NSString *body = options[@"body"];

  if (!title || !body) {
    reject(@"INVALID_OPTIONS", @"Title and body are required", nil);
    return;
  }

  UNMutableNotificationContent *content = [[UNMutableNotificationContent alloc] init];
  content.title = title;
  content.body = body;
  content.sound = [UNNotificationSound defaultSound];

  NSString *identifier = [[NSUUID UUID] UUIDString];
  UNTimeIntervalNotificationTrigger *trigger = [UNTimeIntervalNotificationTrigger
                                                triggerWithTimeInterval:1
                                                                repeats:NO];

  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:identifier
                                                                        content:content
                                                                        trigger:trigger];

  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (error) {
        resolve(@NO);
      } else {
        resolve(@YES);
      }
    });
  }];
}

RCT_EXPORT_METHOD(createChannel:(NSString *)channelId
                  channelName:(NSString *)channelName
                  description:(NSString *)description
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  // Notification channels are Android-specific, no-op on iOS
  resolve(@YES);
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeNotificationsSpecJSI>(params);
}
#endif

@end
