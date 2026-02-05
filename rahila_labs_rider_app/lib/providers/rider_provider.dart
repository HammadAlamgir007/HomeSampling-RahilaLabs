import 'package:flutter/foundation.dart';
import '../models/rider.dart';
import '../models/task.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import 'package:geolocator/geolocator.dart';

class RiderProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final LocationService _locationService = LocationService();

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

  // Login
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

  // Logout
  Future<void> logout() async {
    await _apiService.clearToken();
    _rider = null;
    _tasks = [];
    _history = [];
    notifyListeners();
  }

  // Load Profile
  Future<void> loadProfile() async {
    try {
      _rider = await _apiService.getProfile();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Update Availability Status
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
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Start Location Tracking
  Future<void> startLocationTracking() async {
    try {
      _currentPosition = await _locationService.getCurrentLocation();
      
      // Update location on server
      await _apiService.updateProfile(
        latitude: _currentPosition!.latitude,
        longitude: _currentPosition!.longitude,
      );

      // Listen to location updates
      _locationService.getLocationStream().listen((Position position) {
        _currentPosition = position;
        
        // Update server every location change
        _apiService.updateProfile(
          latitude: position.latitude,
          longitude: position.longitude,
        );
        
        notifyListeners();
      });
    } catch (e) {
      print('Location tracking error: $e');
    }
  }

  // Load Tasks
  Future<void> loadTasks() async {
    _isLoading = true;
    notifyListeners();

    try {
      _tasks = await _apiService.getTasks();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load History
  Future<void> loadHistory() async {
    try {
      _history = await _apiService.getTaskHistory();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  // Accept Task
  Future<bool> acceptTask(int taskId) async {
    try {
      await _apiService.acceptTask(taskId);
      await loadTasks();
      await updateStatus('busy');
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Reject Task
  Future<bool> rejectTask(int taskId, String reason) async {
    try {
      await _apiService.rejectTask(taskId, reason);
      await loadTasks();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Mark On Way
  Future<bool> markOnWay(int taskId) async {
    try {
      await _apiService.markOnWay(taskId);
      await loadTasks();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Collect Sample
  Future<bool> collectSample({
    required int taskId,
    required String photoPath,
    required String notes,
  }) async {
    try {
      final position = await _locationService.getCurrentLocation();
      
      await _apiService.collectSample(
        taskId: taskId,
        photoPath: photoPath,
        notes: notes,
        latitude: position.latitude,
        longitude: position.longitude,
      );
      
      await loadTasks();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Deliver Sample
  Future<bool> deliverSample(int taskId) async {
    try {
      await _apiService.deliverSample(taskId);
      await loadTasks();
      await updateStatus('available');
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
