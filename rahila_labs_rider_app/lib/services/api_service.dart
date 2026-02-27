import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import '../models/rider.dart';
import '../models/task.dart';
import 'secure_storage_service.dart';

/// Exception thrown when the API returns HTTP 401 (expired / invalid token).
class UnauthorizedException implements Exception {
  final String message;
  const UnauthorizedException([this.message = 'Session expired. Please log in again.']);
  @override
  String toString() => message;
}

class ApiService {
  static const String baseUrl = 'http://localhost:5000/api'; // Web / Chrome
  // Use 'http://10.0.2.2:5000/api' for Android emulator
  // Use 'http://192.168.100.28:5000/api' for physical device (replace with your LAN IP)

  // ─── Token helpers (delegate to SecureStorageService) ───────────────────────

  Future<String?> getToken() => SecureStorageService.getToken();
  Future<void> saveToken(String token) => SecureStorageService.saveToken(token);
  Future<void> clearToken() => SecureStorageService.clearToken();

  // ─── Auth headers ───────────────────────────────────────────────────────────

  Future<Map<String, String>> _authHeaders() async {
    final token = await getToken();
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
  }

  // ─── 401 Interceptor ────────────────────────────────────────────────────────

  /// Wraps every HTTP response. Throws [UnauthorizedException] on 401.
  http.Response _intercept(http.Response response) {
    if (response.statusCode == 401) {
      throw const UnauthorizedException();
    }
    return response;
  }

  // ─── Login ──────────────────────────────────────────────────────────────────

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

  // ─── Get Profile ─────────────────────────────────────────────────────────────

  Future<Rider> getProfile() async {
    final response = _intercept(
      await http.get(
        Uri.parse('$baseUrl/rider/profile'),
        headers: await _authHeaders(),
      ),
    );

    if (response.statusCode == 200) {
      return Rider.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load profile');
    }
  }

  // ─── Update Profile (location / status) ─────────────────────────────────────

  Future<void> updateProfile({
    double? latitude,
    double? longitude,
    String? status,
  }) async {
    final body = <String, dynamic>{};
    if (latitude != null) body['gps_latitude'] = latitude;
    if (longitude != null) body['gps_longitude'] = longitude;
    if (status != null) body['availability_status'] = status;

    final response = _intercept(
      await http.put(
        Uri.parse('$baseUrl/rider/profile'),
        headers: await _authHeaders(),
        body: jsonEncode(body),
      ),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update profile');
    }
  }

  // ─── Tasks ──────────────────────────────────────────────────────────────────

  Future<List<Task>> getTasks() async {
    final response = _intercept(
      await http.get(
        Uri.parse('$baseUrl/rider/tasks'),
        headers: await _authHeaders(),
      ),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['tasks'] as List).map((t) => Task.fromJson(t)).toList();
    } else {
      throw Exception('Failed to load tasks');
    }
  }

  Future<List<Task>> getTaskHistory() async {
    final response = _intercept(
      await http.get(
        Uri.parse('$baseUrl/rider/tasks/history'),
        headers: await _authHeaders(),
      ),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['tasks'] as List).map((t) => Task.fromJson(t)).toList();
    } else {
      throw Exception('Failed to load history');
    }
  }

  // ─── Mark On Way ─────────────────────────────────────────────────────────────
  Future<void> markOnWay(int taskId) async {
    final response = _intercept(
      await http.put(
        Uri.parse('$baseUrl/rider/tasks/$taskId/on-way'),
        headers: await _authHeaders(),
      ),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update status');
    }

    return;
  }

  Future<void> markArrived(int taskId) async {
    final response = _intercept(
      await http.put(
        Uri.parse('$baseUrl/rider/tasks/$taskId/arrive'),
        headers: await _authHeaders(),
      ),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['msg'] ?? 'Failed to mark arrived');
    }
  }

  Future<void> collectSample({
    required int taskId,
    required XFile photo,
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

    // Ensure a valid filename with extension for Flask's secure_filename()
    final String secureFilename = (photo.name.isNotEmpty && photo.name.contains('.'))
        ? photo.name
        : '${photo.name.isNotEmpty ? photo.name : "sample_photo"}_${DateTime.now().millisecondsSinceEpoch}.jpg';

    final bytes = await photo.readAsBytes();
    request.files.add(http.MultipartFile.fromBytes(
      'sample_photo',
      bytes,
      filename: secureFilename,
      contentType: MediaType('image', 'jpeg'),
    ));

    final streamedResponse = await request.send();

    if (streamedResponse.statusCode == 401) {
      throw const UnauthorizedException();
    }

    if (streamedResponse.statusCode != 200) {
      final respStr = await streamedResponse.stream.bytesToString();
      throw Exception('Failed to collect sample: ${streamedResponse.statusCode} - $respStr');
    }
  }

  Future<void> deliverSample(int taskId) async {
    final response = _intercept(
      await http.put(
        Uri.parse('$baseUrl/rider/tasks/$taskId/deliver'),
        headers: await _authHeaders(),
      ),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to deliver sample');
    }
  }
}
