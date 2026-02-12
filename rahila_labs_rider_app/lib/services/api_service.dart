import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/rider.dart';
import '../models/task.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:5000/api'; // For Chrome/Web
  // Use 'http://10.0.2.2:5000/api' for Android emulator
  // Use your actual IP for physical device

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/rider/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await saveToken(data['access_token']);
      return data;
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['msg'] ?? 'Login failed');
    }
  }

  // Get Profile
  Future<Rider> getProfile() async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/rider/profile'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return Rider.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load profile');
    }
  }

  // Update Profile (location, status)
  Future<void> updateProfile({
    double? latitude,
    double? longitude,
    String? status,
  }) async {
    final token = await getToken();
    final body = <String, dynamic>{};
    
    if (latitude != null) body['gps_latitude'] = latitude;
    if (longitude != null) body['gps_longitude'] = longitude;
    if (status != null) body['availability_status'] = status;

    final response = await http.put(
      Uri.parse('$baseUrl/rider/profile'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update profile');
    }
  }

  // Get Tasks
  Future<List<Task>> getTasks() async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/rider/tasks'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    print('GET /rider/tasks - Status: ${response.statusCode}');
    print('Response body: ${response.body}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      print('Decoded data: $data');
      final tasks = (data['tasks'] as List)
          .map((task) => Task.fromJson(task))
          .toList();
      print('Parsed ${tasks.length} tasks');
      return tasks;
    } else {
      throw Exception('Failed to load tasks');
    }
  }

  // Get Task History
  Future<List<Task>> getTaskHistory() async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/rider/tasks/history'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final tasks = (data['tasks'] as List)
          .map((task) => Task.fromJson(task))
          .toList();
      return tasks;
    } else {
      throw Exception('Failed to load history');
    }
  }

  // Accept Task
  Future<void> acceptTask(int taskId) async {
    final token = await getToken();
    final response = await http.put(
      Uri.parse('$baseUrl/rider/tasks/$taskId/accept'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['msg'] ?? 'Failed to accept task');
    }
  }

  // Reject Task
  Future<void> rejectTask(int taskId, String reason) async {
    final token = await getToken();
    final response = await http.put(
      Uri.parse('$baseUrl/rider/tasks/$taskId/reject'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'reason': reason}),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['msg'] ?? 'Failed to reject task');
    }
  }

  // Mark On Way
  Future<void> markOnWay(int taskId) async {
    final token = await getToken();
    final response = await http.put(
      Uri.parse('$baseUrl/rider/tasks/$taskId/on-way'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update status');
    }
  }

  // Collect Sample
  Future<void> collectSample({
    required int taskId,
    required String photoPath,
    required String notes,
    required double latitude,
    required double longitude,
  }) async {
    final token = await getToken();
    
    var request = http.MultipartRequest(
      'PUT',
      Uri.parse('$baseUrl/rider/tasks/$taskId/collect'),
    );

    request.headers['Authorization'] = 'Bearer $token';
    request.fields['notes'] = notes;
    request.fields['latitude'] = latitude.toString();
    request.fields['longitude'] = longitude.toString();
    request.files.add(await http.MultipartFile.fromPath('sample_photo', photoPath));

    final response = await request.send();

    if (response.statusCode != 200) {
      throw Exception('Failed to collect sample');
    }
  }

  // Deliver Sample
  Future<void> deliverSample(int taskId) async {
    final token = await getToken();
    final response = await http.put(
      Uri.parse('$baseUrl/rider/tasks/$taskId/deliver'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to deliver sample');
    }
  }
}
