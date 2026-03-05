import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'secure_storage_service.dart';
import 'api_service.dart';

/// Model for a notification from the backend.
class RiderNotification {
  final int id;
  final String message;
  final String type;
  final bool isRead;
  final DateTime createdAt;

  RiderNotification({
    required this.id,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  factory RiderNotification.fromJson(Map<String, dynamic> json) {
    return RiderNotification(
      id: json['id'] ?? 0,
      message: json['message'] ?? '',
      type: json['notification_type'] ?? json['type'] ?? '',
      isRead: json['is_read'] ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at']) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

/// Manages local notifications and polls the backend for new unread notifications.
class NotificationService extends ChangeNotifier {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  final ApiService _api = ApiService();

  List<RiderNotification> _notifications = [];
  int _unreadCount = 0;
  Timer? _pollingTimer;
  final Set<int> _shownNotificationIds = {};
  bool _initialized = false;

  List<RiderNotification> get notifications => _notifications;
  int get unreadCount => _unreadCount;

  // ── Initialization ──────────────────────────────────────────────────────────

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(settings);

    // Request Android 13+ notification permission
    if (!kIsWeb) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
    }
  }

  // ── Polling ─────────────────────────────────────────────────────────────────

  /// Start polling for new notifications every [intervalSeconds].
  void startPolling({int intervalSeconds = 30}) {
    stopPolling();
    // Poll immediately then on schedule
    _poll();
    _pollingTimer = Timer.periodic(Duration(seconds: intervalSeconds), (_) {
      _poll();
    });
  }

  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  Future<void> _poll() async {
    try {
      final token = await SecureStorageService.getToken();
      if (token == null) return;

      final fresh = await _api.getNotifications();
      _notifications = fresh;
      _unreadCount = fresh.where((n) => !n.isRead).length;

      // Show local notification for each new unread notification
      for (final n in fresh) {
        if (!n.isRead && !_shownNotificationIds.contains(n.id)) {
          _shownNotificationIds.add(n.id);
          await _showLocalNotification(n);
        }
      }

      notifyListeners();
    } catch (e) {
      // Silently fail — polling should not crash the app
    }
  }

  // ── Local Notifications ─────────────────────────────────────────────────────

  Future<void> _showLocalNotification(RiderNotification n) async {
    const androidDetails = AndroidNotificationDetails(
      'rahila_rider_channel',
      'Rahila Labs Rider',
      channelDescription: 'Task assignments and reminders',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    const details = NotificationDetails(android: androidDetails, iOS: iosDetails);

    await _localNotifications.show(
      n.id, // notification id
      _titleFor(n.type),
      n.message,
      details,
    );
  }

  String _titleFor(String type) {
    switch (type) {
      case 'task_assigned':
        return '📋 New Task Assigned';
      case 'rider_on_way':
        return '🚴 Task Update';
      case 'sample_collected':
        return '🧪 Sample Collected';
      case 'sample_delivered':
        return '✅ Sample Delivered';
      default:
        return '🔔 Rahila Labs';
    }
  }

  // ── Mark Read via API ───────────────────────────────────────────────────────

  Future<void> markRead(int notificationId) async {
    try {
      await _api.markNotificationRead(notificationId);
      _notifications = _notifications.map((n) {
        if (n.id == notificationId) {
          return RiderNotification(
            id: n.id, message: n.message, type: n.type,
            isRead: true, createdAt: n.createdAt,
          );
        }
        return n;
      }).toList();
      _unreadCount = _notifications.where((n) => !n.isRead).length;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    try {
      await _api.markAllNotificationsRead();
      _notifications = _notifications.map((n) => RiderNotification(
        id: n.id, message: n.message, type: n.type,
        isRead: true, createdAt: n.createdAt,
      )).toList();
      _unreadCount = 0;
      notifyListeners();
    } catch (_) {}
  }

  void clearOnLogout() {
    stopPolling();
    _notifications = [];
    _unreadCount = 0;
    _shownNotificationIds.clear();
    _initialized = false;
    notifyListeners();
  }
}
