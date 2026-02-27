import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import '../models/rider.dart';
import '../models/task.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../services/secure_storage_service.dart';
import '../services/connectivity_service.dart';
import '../services/offline_queue_service.dart';
import 'package:geolocator/geolocator.dart';

/// Callback invoked when the session expires (401) so the app can navigate to Login.
typedef OnUnauthorized = void Function();

class RiderProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final LocationService _locationService = LocationService();

  /// Set this after provider creation so the app can handle auto-logout.
  OnUnauthorized? onUnauthorized;

  /// Offline queue — set from main.dart after init.
  OfflineQueueService? offlineQueue;

  Rider? _rider;
  List<Task> _tasks = [];
  List<Task> _history = [];
  bool _isLoading = false;
  String? _error;
  Position? _currentPosition;

  Rider? get rider => _rider;
  List<Task> get tasks => _tasks;
  List<Task> get history => _history;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Position? get currentPosition => _currentPosition;
  bool get isLoggedIn => _rider != null;

  /// The current task that is in rider_on_way status (at most one at a time).
  Task? get activeOnWayTask {
    try {
      return _tasks.firstWhere((t) => t.isOnWay);
    } catch (_) {
      return null;
    }
  }

  /// Count of active (non-delivered, non-history) tasks.
  int get activeTaskCount => _tasks.length;

  // ─── Offline queue support ───────────────────────────────────────────────────

  /// Call once after login to replay queued actions when connectivity restores.
  void listenForReconnect() {
    ConnectivityService.instance.onStatusChanged.listen((isOnline) {
      if (isOnline && offlineQueue != null && offlineQueue!.hasPending) {
        debugPrint('[RiderProvider] Back online — flushing ${offlineQueue!.pendingCount} queued action(s)');
        flushOfflineQueue();
      }
    });
  }

  /// Replay all pending offline actions in FIFO order.
  Future<void> flushOfflineQueue() async {
    final queue = offlineQueue;
    if (queue == null || !queue.hasPending) return;
    if (!ConnectivityService.instance.isOnline) return;

    final pending = List<QueuedAction>.from(queue.queue);
    for (final action in pending) {
      bool success = false;
      try {
        switch (action.type) {
          case QueuedActionType.markOnWay:
            success = await _doMarkOnWay(action.taskId);
          case QueuedActionType.markArrived:
            success = await _doMarkArrived(action.taskId);
          case QueuedActionType.deliverSample:
            success = await _doDeliverSample(action.taskId);
          case QueuedActionType.collectSample:
            // collectSample needs a photo — we can't replay without the file path
            // so we skip and notify the user to retry manually
            debugPrint('[OfflineQueue] collectSample cannot auto-replay (photo required). Skipped.');
            success = false;
        }
      } catch (e) {
        debugPrint('[OfflineQueue] Failed to replay ${action.displayLabel}: $e');
      }
      if (success) await queue.remove(action.id);
    }
    await loadTasks();
  }

  bool _isOffline() => !ConnectivityService.instance.isOnline;

  // ─── Session expired handler ─────────────────────────────────────────────────

  void _handleUnauthorized() {
    _rider = null;
    _tasks = [];
    _history = [];
    _error = 'Session expired. Please log in again.';
    SecureStorageService.clearToken();
    notifyListeners();
    onUnauthorized?.call();
  }

  // ─── Auto-login (called from SplashScreen) ───────────────────────────────────

  /// Checks for a stored JWT and tries to restore the session.
  /// Returns true if auto-login succeeded, false otherwise.
  Future<bool> tryAutoLogin() async {
    final hasToken = await SecureStorageService.hasToken();
    if (!hasToken) return false;

    try {
      _rider = await _apiService.getProfile();
      notifyListeners();
      await startLocationTracking();
      return true;
    } on UnauthorizedException {
      await SecureStorageService.clearToken();
      return false;
    } catch (_) {
      // Network error or other issue — clear and force re-login
      await SecureStorageService.clearToken();
      return false;
    }
  }

  // ─── Login ──────────────────────────────────────────────────────────────────

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.login(email, password);
      _rider = Rider.fromJson(data['rider']);
      _isLoading = false;
      notifyListeners();

      // Start location tracking after login
      await startLocationTracking();

      return true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────

  Future<void> logout() async {
    await SecureStorageService.clearToken();
    _rider = null;
    _tasks = [];
    _history = [];
    _error = null;
    notifyListeners();
  }

  // ─── Load Profile ────────────────────────────────────────────────────────────

  Future<void> loadProfile() async {
    try {
      _rider = await _apiService.getProfile();
      notifyListeners();
    } on UnauthorizedException {
      _handleUnauthorized();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // ─── Update Availability Status ──────────────────────────────────────────────

  Future<void> updateStatus(String status) async {
    try {
      await _apiService.updateProfile(status: status);
      if (_rider != null) {
        _rider = Rider(
          id: _rider!.id,
          name: _rider!.name,
          email: _rider!.email,
          phone: _rider!.phone,
          availabilityStatus: status,
          gpsLatitude: _rider!.gpsLatitude,
          gpsLongitude: _rider!.gpsLongitude,
          profilePhoto: _rider!.profilePhoto,
          stats: _rider!.stats,
        );
        notifyListeners();
      }
    } on UnauthorizedException {
      _handleUnauthorized();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // ─── Location Tracking ───────────────────────────────────────────────────────

  Future<void> startLocationTracking() async {
    try {
      _currentPosition = await _locationService.getCurrentLocation();

      await _apiService.updateProfile(
        latitude: _currentPosition!.latitude,
        longitude: _currentPosition!.longitude,
      );

      _locationService.getLocationStream().listen((Position position) {
        _currentPosition = position;
        _apiService.updateProfile(
          latitude: position.latitude,
          longitude: position.longitude,
        );
        notifyListeners();
      });
    } catch (e) {
      // Location is optional — silently ignore errors
      debugPrint('Location tracking error: $e');
    }
  }

  // ─── Load Tasks ──────────────────────────────────────────────────────────────

  Future<void> loadTasks() async {
    _isLoading = true;
    notifyListeners();

    try {
      _tasks = await _apiService.getTasks();
      // Sort by urgency: breached/critical tasks first, then by nearest deadline
      _tasks.sort((a, b) => a.sortKey.compareTo(b.sortKey));
      _isLoading = false;
      notifyListeners();
    } on UnauthorizedException {
      _isLoading = false;
      _handleUnauthorized();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // ─── Load History ────────────────────────────────────────────────────────────

  Future<void> loadHistory() async {
    try {
      _history = await _apiService.getTaskHistory();
      notifyListeners();
    } on UnauthorizedException {
      _handleUnauthorized();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // ─── Mark On Way ─────────────────────────────────────────────────────────────

  Future<bool> markOnWay(int taskId) async {
    if (_isOffline()) {
      await offlineQueue?.enqueue(QueuedAction(
        type: QueuedActionType.markOnWay,
        taskId: taskId,
        queuedAt: DateTime.now(),
        id: 'onway_${taskId}_${DateTime.now().millisecondsSinceEpoch}',
      ));
      _error = 'You\'re offline. Action queued — will sync when reconnected.';
      notifyListeners();
      return false;
    }
    return _doMarkOnWay(taskId);
  }

  Future<bool> _doMarkOnWay(int taskId) async {
    try {
      await _apiService.markOnWay(taskId);
      await loadTasks();
      return true;
    } on UnauthorizedException {
      _handleUnauthorized();
      return false;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // ─── Mark Arrived ─────────────────────────────────────────────────────────────

  Future<bool> markArrived(int taskId) async {
    if (_isOffline()) {
      await offlineQueue?.enqueue(QueuedAction(
        type: QueuedActionType.markArrived,
        taskId: taskId,
        queuedAt: DateTime.now(),
        id: 'arrived_${taskId}_${DateTime.now().millisecondsSinceEpoch}',
      ));
      _error = 'You\'re offline. Action queued — will sync when reconnected.';
      notifyListeners();
      return false;
    }
    return _doMarkArrived(taskId);
  }

  Future<bool> _doMarkArrived(int taskId) async {
    try {
      // Client-side geo-fence pre-check
      final task = _tasks.firstWhere((t) => t.id == taskId, orElse: () => throw Exception('Task not found'));
      try {
        final pos = await _locationService.getCurrentLocation().timeout(const Duration(seconds: 5));
        final geoError = _locationService.validateGeofence(
          riderLat: pos.latitude,
          riderLng: pos.longitude,
          patientLat: task.patientLatitude,
          patientLng: task.patientLongitude,
        );
        if (geoError != null) {
          _error = geoError;
          notifyListeners();
          return false;
        }
      } catch (locErr) {
        debugPrint('GPS unavailable for geo-fence check: $locErr');
      }
      await _apiService.markArrived(taskId);
      await loadTasks();
      return true;
    } on UnauthorizedException {
      _handleUnauthorized();
      return false;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // ─── Collect Sample ──────────────────────────────────────────────────────────

  Future<bool> collectSample({
    required int taskId,
    required XFile photo,
    required String notes,
  }) async {
    try {
      double lat = 0.0;
      double lng = 0.0;

      try {
        final position = await _locationService
            .getCurrentLocation()
            .timeout(const Duration(seconds: 5));
        lat = position.latitude;
        lng = position.longitude;

        // Client-side geo-fence pre-check for collect
        final task = _tasks.firstWhere((t) => t.id == taskId, orElse: () => throw Exception('Task not found'));
        final geoError = _locationService.validateGeofence(
          riderLat: lat,
          riderLng: lng,
          patientLat: task.patientLatitude,
          patientLng: task.patientLongitude,
        );
        if (geoError != null) {
          _error = geoError;
          notifyListeners();
          return false;
        }
      } catch (locErr) {
        debugPrint('Skipping precise location: $locErr');
      }

      await _apiService.collectSample(
        taskId: taskId,
        photo: photo,
        notes: notes,
        latitude: lat,
        longitude: lng,
      );

      await loadTasks();
      return true;
    } on UnauthorizedException {
      _handleUnauthorized();
      return false;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // ─── Deliver Sample ──────────────────────────────────────────────────────────

  Future<bool> deliverSample(int taskId) async {
    if (_isOffline()) {
      await offlineQueue?.enqueue(QueuedAction(
        type: QueuedActionType.deliverSample,
        taskId: taskId,
        queuedAt: DateTime.now(),
        id: 'deliver_${taskId}_${DateTime.now().millisecondsSinceEpoch}',
      ));
      _error = 'You\'re offline. Action queued — will sync when reconnected.';
      notifyListeners();
      return false;
    }
    return _doDeliverSample(taskId);
  }

  Future<bool> _doDeliverSample(int taskId) async {
    try {
      await _apiService.deliverSample(taskId);
      await loadTasks();
      await updateStatus('available');
      return true;
    } on UnauthorizedException {
      _handleUnauthorized();
      return false;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
