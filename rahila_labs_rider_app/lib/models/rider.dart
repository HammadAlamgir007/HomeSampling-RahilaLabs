class Rider {
  final int id;
  final String name;
  final String email;
  final String phone;
  final String availabilityStatus;
  final double? gpsLatitude;
  final double? gpsLongitude;
  final String? profilePhoto;
  final RiderStats? stats;

  Rider({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.availabilityStatus,
    this.gpsLatitude,
    this.gpsLongitude,
    this.profilePhoto,
    this.stats,
  });

  factory Rider.fromJson(Map<String, dynamic> json) {
    return Rider(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
      availabilityStatus: json['availability_status'] ?? 'offline',
      gpsLatitude: json['gps_latitude']?.toDouble(),
      gpsLongitude: json['gps_longitude']?.toDouble(),
      profilePhoto: json['profile_photo'],
      stats: json['stats'] != null ? RiderStats.fromJson(json['stats']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'availability_status': availabilityStatus,
      'gps_latitude': gpsLatitude,
      'gps_longitude': gpsLongitude,
      'profile_photo': profilePhoto,
    };
  }
}

class RiderStats {
  final int completedTasks;
  final int pendingTasks;

  RiderStats({
    required this.completedTasks,
    required this.pendingTasks,
  });

  factory RiderStats.fromJson(Map<String, dynamic> json) {
    return RiderStats(
      completedTasks: json['completed_tasks'] ?? 0,
      pendingTasks: json['pending_tasks'] ?? 0,
    );
  }
}
