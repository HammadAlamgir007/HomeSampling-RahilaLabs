import 'package:geolocator/geolocator.dart';

class LocationService {
  // Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  // Check location permission
  Future<LocationPermission> checkPermission() async {
    return await Geolocator.checkPermission();
  }

  // Request location permission
  Future<LocationPermission> requestPermission() async {
    return await Geolocator.requestPermission();
  }

  // Get current location
  Future<Position> getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied');
    }

    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  // Get location stream for real-time tracking
  Stream<Position> getLocationStream() {
    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Update every 10 meters
      ),
    );
  }

  // Calculate distance between two points (in meters)
  double calculateDistance(
    double startLat,
    double startLng,
    double endLat,
    double endLng,
  ) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng);
  }

  /// Validates that the rider is within [maxMeters] of the patient location.
  ///
  /// Returns `null` if within range (OK to proceed).
  /// Returns an error message string if out of range.
  /// Returns `null` if patient coordinates are not set (skips validation gracefully).
  String? validateGeofence({
    required double riderLat,
    required double riderLng,
    required double? patientLat,
    required double? patientLng,
    double maxMeters = 200.0,
  }) {
    // If patient location isn't configured, skip geo-fence check
    if (patientLat == null || patientLng == null) {
      return null;
    }

    final distanceMeters = calculateDistance(
      riderLat, riderLng,
      patientLat, patientLng,
    );

    if (distanceMeters > maxMeters) {
      final distanceStr = distanceMeters >= 1000
          ? '${(distanceMeters / 1000).toStringAsFixed(1)} km'
          : '${distanceMeters.toStringAsFixed(0)} m';
      return 'You are too far from the patient location ($distanceStr away). '
          'Move within ${maxMeters.toInt()}m to proceed.';
    }

    return null; // Within range — OK
  }
}
