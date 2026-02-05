import 'dart:convert';
import '../models/rider.dart';
import '../models/task.dart';

/// Mock API service for testing without backend
/// Switch back to api_service.dart when backend is ready
class MockApiService {
  // Simulated delay for realistic feel
  Future<void> _delay() => Future.delayed(const Duration(milliseconds: 500));

  // Mock token storage
  String? _token;

  Future<String?> getToken() async => _token;
  Future<void> saveToken(String token) async => _token = token;
  Future<void> clearToken() async => _token = null;

  // Mock Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    await _delay();
    
    if (email == 'ahmed@rider.com' && password == 'rider123') {
      _token = 'mock_token_12345';
      return {
        'access_token': _token,
        'rider': {
          'id': 1,
          'name': 'Ahmed Khan',
          'email': 'ahmed@rider.com',
          'phone': '03001234567',
          'availability_status': 'available',
          'gps_latitude': 31.5204,
          'gps_longitude': 74.3587,
          'profile_photo': null,
          'stats': {
            'completed_tasks': 15,
            'pending_tasks': 3,
          }
        }
      };
    } else {
      throw Exception('Invalid credentials');
    }
  }

  // Mock Get Profile
  Future<Rider> getProfile() async {
    await _delay();
    return Rider.fromJson({
      'id': 1,
      'name': 'Ahmed Khan',
      'email': 'ahmed@rider.com',
      'phone': '03001234567',
      'availability_status': 'available',
      'gps_latitude': 31.5204,
      'gps_longitude': 74.3587,
      'stats': {
        'completed_tasks': 15,
        'pending_tasks': 3,
      }
    });
  }

  // Mock Update Profile
  Future<void> updateProfile({
    double? latitude,
    double? longitude,
    String? status,
  }) async {
    await _delay();
    // Simulate success
  }

  // Mock Get Tasks
  Future<List<Task>> getTasks() async {
    await _delay();
    return [
      Task.fromJson({
        'id': 1,
        'user_id': 2,
        'test_id': 1,
        'appointment_date': DateTime.now().toIso8601String(),
        'status': 'assigned_to_rider',
        'address': '123 Main Street, Lahore',
        'patient_name': 'Ali Ahmed',
        'patient_phone': '03001234567',
        'test_name': 'Complete Blood Count',
      }),
      Task.fromJson({
        'id': 2,
        'user_id': 3,
        'test_id': 2,
        'appointment_date': DateTime.now().add(const Duration(hours: 2)).toIso8601String(),
        'status': 'rider_accepted',
        'address': '456 Park Avenue, Lahore',
        'patient_name': 'Sara Khan',
        'patient_phone': '03009876543',
        'test_name': 'Thyroid Profile',
      }),
      Task.fromJson({
        'id': 3,
        'user_id': 4,
        'test_id': 3,
        'appointment_date': DateTime.now().add(const Duration(hours: 4)).toIso8601String(),
        'status': 'rider_on_way',
        'address': '789 Garden Road, Lahore',
        'patient_name': 'Hassan Ali',
        'patient_phone': '03007654321',
        'test_name': 'Lipid Profile',
      }),
    ];
  }

  // Mock Get Task History
  Future<List<Task>> getTaskHistory() async {
    await _delay();
    return [
      Task.fromJson({
        'id': 10,
        'user_id': 5,
        'test_id': 1,
        'appointment_date': DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
        'status': 'delivered_to_lab',
        'address': '111 Old Street, Lahore',
        'patient_name': 'Fatima Malik',
        'patient_phone': '03001111111',
        'test_name': 'Complete Blood Count',
        'collection_notes': 'Sample collected successfully',
      }),
      Task.fromJson({
        'id': 11,
        'user_id': 6,
        'test_id': 2,
        'appointment_date': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
        'status': 'delivered_to_lab',
        'address': '222 New Avenue, Lahore',
        'patient_name': 'Usman Shah',
        'patient_phone': '03002222222',
        'test_name': 'Thyroid Profile',
        'collection_notes': 'Patient was very cooperative',
      }),
    ];
  }

  // Mock Accept Task
  Future<void> acceptTask(int taskId) async {
    await _delay();
    // Simulate success
  }

  // Mock Reject Task
  Future<void> rejectTask(int taskId, String reason) async {
    await _delay();
    // Simulate success
  }

  // Mock Mark On Way
  Future<void> markOnWay(int taskId) async {
    await _delay();
    // Simulate success
  }

  // Mock Collect Sample
  Future<void> collectSample({
    required int taskId,
    required String photoPath,
    required String notes,
    required double latitude,
    required double longitude,
  }) async {
    await _delay();
    // Simulate success
  }

  // Mock Deliver Sample
  Future<void> deliverSample(int taskId) async {
    await _delay();
    // Simulate success
  }
}
